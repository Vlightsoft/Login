const express = require('express');
const router = express.Router();
const VerifiedDomain = require('../models/VerifiedDomain');
const UserPlan = require('../models/UserPlan');
const authMiddleware = require('../middleware/authMiddleware');

// 🧠 Helper to fetch active plan
async function getActiveUserPlan(userId) {
  return await UserPlan.findOne({ userId, isActive: true });
}

// 🚀 Add new domain
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const domain = req.body.domain?.toLowerCase();

    if (!domain) {
      return res.status(400).json({ code: 400, response: 'fail', message: 'Domain is required' });
    }

    const userPlan = await getActiveUserPlan(userId);
    const domainLimitRaw = userPlan?.limits?.get('Domain Limit') ?? 5;
    const domainLimit = domainLimitRaw === 'Unlimited' ? Infinity : parseInt(domainLimitRaw);
    const currentUsage = userPlan.usage?.get('Domain Limit') || 0;

    if (currentUsage >= domainLimit) {
      return res.status(403).json({
        code: 403,
        response: 'fail',
        message: `Domain limit exceeded. Your plan allows up to ${domainLimitRaw} domains.`
      });
    }

    const exists = await VerifiedDomain.findOne({ userId, domain });
    if (exists) {
      return res.status(409).json({ code: 409, response: 'fail', message: 'Domain already exists' });
    }

    const newRecord = await VerifiedDomain.create({ userId, domain });

    userPlan.usage.set('Domain Limit', currentUsage + 1);
    userPlan.markModified('usage');
    await userPlan.save();

    res.status(201).json({ code: 201, response: 'success', message: newRecord });
  } catch (err) {
    console.error('❌ Error adding domain:', err.message);
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// 📄 Get all domains
router.get('/', authMiddleware, async (req, res) => {
  try {
    const domains = await VerifiedDomain.find({ userId: req.user._id });
    res.json({ code: 200, response: 'success', message: domains });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// ✅ Verify domain
router.put('/verify/:domain', authMiddleware, async (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase();
    const updated = await VerifiedDomain.findOneAndUpdate(
      { userId: req.user._id, domain },
      { status: 'verified', notified: false },
      { new: true }
    );
    res.json({ code: 200, response: 'success', message: updated });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// 🗑 Request domain deletion (and decrement usage)
router.delete('/:domain', authMiddleware, async (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase();

    const updated = await VerifiedDomain.findOneAndUpdate(
      { userId: req.user._id, domain },
      { status: 'deleting', 'fromAddresses.$[].status': 'pending_delete' },
      { new: true }
    );

    if (updated) {
      const userPlan = await getActiveUserPlan(req.user._id);
      const current = userPlan.usage?.get('Domain Limit') || 0;
      userPlan.usage.set('Domain Limit', Math.max(0, current - 1));
      userPlan.markModified('usage');
      await userPlan.save();
    }

    res.json({ code: 200, response: 'success', message: updated });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// ➕ Add from address (with limit check)
router.post('/:domain/from-address', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const domain = req.params.domain.toLowerCase();
    const { email } = req.body;

    if (!email || !email.endsWith(`@${domain}`)) {
      return res.status(400).json({
        code: 400,
        response: 'fail',
        message: `Email must end with @${domain}`
      });
    }

    const userPlan = await getActiveUserPlan(userId);
    const fromLimitRaw = userPlan?.limits?.get('From Address Limit') ?? 5;
    const fromLimit = fromLimitRaw === 'Unlimited' ? Infinity : parseInt(fromLimitRaw);
    const currentUsage = userPlan.usage?.get('From Address Limit') || 0;

    if (currentUsage >= fromLimit) {
      return res.status(403).json({
        code: 403,
        response: 'fail',
        message: `From address limit exceeded. You can add up to ${fromLimitRaw} addresses.`
      });
    }

    const updated = await VerifiedDomain.findOneAndUpdate(
      { userId, domain },
      { $addToSet: { fromAddresses: { email } } },
      { new: true }
    );

    userPlan.usage.set('From Address Limit', currentUsage + 1);
    userPlan.markModified('usage');
    await userPlan.save();

    res.json({ code: 200, response: 'success', message: updated });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// ❌ Soft delete from address (and decrement usage)
router.delete('/:domain/from-address/:email', authMiddleware, async (req, res) => {
  try {
    const { domain, email } = req.params;

    const updated = await VerifiedDomain.findOneAndUpdate(
      {
        userId: req.user._id,
        domain: domain.toLowerCase(),
        'fromAddresses.email': email
      },
      { $set: { 'fromAddresses.$.status': 'pending_delete' } },
      { new: true }
    );

    if (updated) {
      const userPlan = await getActiveUserPlan(req.user._id);
      const current = userPlan.usage?.get('From Address Limit') || 0;
      userPlan.usage.set('From Address Limit', Math.max(0, current - 1));
      userPlan.markModified('usage');
      await userPlan.save();
    }

    res.json({ code: 200, response: 'success', message: updated });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});


// 🔥 Permanently delete domain and clear usage
router.delete('/permanent-delete/:domain', authMiddleware, async (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase();
    const deleted = await VerifiedDomain.findOneAndDelete({ userId: req.user._id, domain });

    if (deleted) {
      const userPlan = await getActiveUserPlan(req.user._id);

      const domainUsage = userPlan.usage?.get('Domain Limit') || 0;
      const fromUsage = userPlan.usage?.get('From Address Limit') || 0;

      userPlan.usage.set('Domain Limit', Math.max(0, domainUsage - 1));
      userPlan.usage.set('From Address Limit', Math.max(0, fromUsage - (deleted.fromAddresses?.length || 0)));
      userPlan.markModified('usage');
      await userPlan.save();
    }

    res.json({ code: 200, response: 'success', message: 'Domain permanently deleted' });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});

// 🔥 Permanently delete from address
router.delete('/permanent-delete/:domain/from-address/:email', authMiddleware, async (req, res) => {
  try {
    const { domain, email } = req.params;

    const updated = await VerifiedDomain.findOneAndUpdate(
      { userId: req.user._id, domain: domain.toLowerCase() },
      { $pull: { fromAddresses: { email } } },
      { new: true }
    );

    if (updated) {
      const userPlan = await getActiveUserPlan(req.user._id);
      const current = userPlan.usage?.get('From Address Limit') || 0;
      userPlan.usage.set('From Address Limit', Math.max(0, current - 1));
      userPlan.markModified('usage');
      await userPlan.save();
    }

    res.json({ code: 200, response: 'success', message: updated });
  } catch (err) {
    res.status(500).json({ code: 500, response: 'error', message: err.message });
  }
});


module.exports = router;
