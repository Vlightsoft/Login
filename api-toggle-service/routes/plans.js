const express = require('express');
const router = express.Router();
const PlanTemplate = require('../models/PlanTemplate');
const UserPlan = require('../models/UserPlan');
const FeatureToggle = require('../models/FeatureToggle');
const authMiddleware = require('../middleware/authMiddleware');
const ApiKey = require('../models/ApiKey');
const normalizeKey = require('../utils/normalizeKey');

// Utility: clean number string
function parseLimit(value) {
  if (typeof value === 'string' && value.trim().toLowerCase() === 'unlimited') return 'Unlimited';
  const n = parseInt(value?.toString().replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}


// PATCH /api/plans/increase-limit
router.patch('/increase-limit', authMiddleware, async (req, res) => {
  const { serviceName, newLimit } = req.body;

  if (!serviceName || typeof newLimit !== 'number') {
    return res.status(400).json({ message: 'serviceName and newLimit are required' });
  }

  try {
   const plan = await UserPlan.findOne({ userId: req.user.id, isActive: true });
console.log(plan);
    if (!plan) {
      return res.status(404).json({ message: 'User plan not found' });
    }


  const formatted = newLimit.toLocaleString('en-US'); // e.g., "30,000"
plan.limits.set(serviceName, formatted); 
    await plan.save();

    res.json({ message: `Limit for '${serviceName}' updated successfully`, limits: plan.limits });
  } catch (err) {
    console.error('Error updating plan limit:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
// 🧾 GET user's API services + all available plans
router.get('/user/plan-services', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const [plans, userPlan, toggles] = await Promise.all([
      PlanTemplate.find(),
      UserPlan.findOne({ userId, isActive: true }),
      FeatureToggle.findOne({ userId })
    ]);
console.log(userPlan);
    const currentLimits = userPlan?.limits ? JSON.parse(JSON.stringify(userPlan.limits)) : {};
console.log(currentLimits);
const apiServices = Object.entries(currentLimits).map(([name, rawLimit]) => ({
  name,
  usage: userPlan?.usage?.get(name) || 0,
  limit: parseLimit(rawLimit),
 enabled: toggles?.toggles?.get(normalizeKey(name)) ?? true // <-- ✅ fix here
}));
    const allPlans = plans.map(p => ({
      selected: userPlan?.planId === p.id,
      id: p.id,
      name: p.name,
      price: p.price,
      maxApiKeys: p.maxApiKeys,
      support: p.support,
      description: p.description,
      limits: p.limits,
      tag: p.tag
    }));

    if (userPlan?.isCustom) {
      allPlans.push({
        selected: true,
        id: "Your Custom Plan",
        name: "Custom",
        price: userPlan.price || "Contact Us",
        maxApiKeys: userPlan.maxApiKeys,
        support: userPlan.support,
        description: "Custom contracts, usage needs, and infrastructure.",
        limits: userPlan.limits
      });
    }

    res.json({
      code: 200,
      response: 'success',
      message: {
        apiServices,
        plans: allPlans
      }
    });
  } catch (err) {
    console.error("❌ Error in plan-services:", err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});

// 🧾 POST /assign → Assign predefined plan to user
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    const planTemplate = await PlanTemplate.findOne({ id: planId });
    if (!planTemplate) {
      return res.status(404).json({
        code: 404,
        response: 'error',
        message: 'Plan not found'
      });
    }
console.log(planTemplate);
    await UserPlan.updateMany({ userId, isActive: true }, { $set: { isActive: false } });

    const newPlan = new UserPlan({
      userId,
      planId: planTemplate.id,
      name: planTemplate.name,
      price: planTemplate.price,
      maxApiKeys: planTemplate.maxApiKeys,
      support: planTemplate.support,
      description: planTemplate.description,
      limits: planTemplate.limits,
      isActive: true,
      isCustom: false
    });

    await newPlan.save();
const toggles = {};
for (const serviceName of planTemplate.limits.keys()) {
 toggles[normalizeKey(serviceName)] = true;
}

await FeatureToggle.findOneAndUpdate(
  { userId },
  { $set: { toggles } },
  { upsert: true, new: true }
);
    
 
  // 🧠 Enforce API key limit with re-enable logic
const maxKeysAllowed = planTemplate.maxApiKeys || 0;

// Get user's keys, including disabled ones
const userKeys = await ApiKey.find({ userId }).sort({ createdAt: 1 }); // oldest first

const updates = userKeys.map((key, i) => ({
  updateOne: {
    filter: { _id: key._id },
    update: { disabled: i >= maxKeysAllowed }
  }
}));

if (updates.length > 0) {
  await ApiKey.bulkWrite(updates);
}

    res.status(201).json({
      code: 201,
      response: 'success',
      message: { info: 'Plan assigned successfully' }
    });
  } catch (err) {
    console.error('❌ Error in assigning plan:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});

// 🧾 POST /assign-custom → Assign custom plan to user
router.post('/assign-custom', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limits, price, maxApiKeys, support } = req.body;

    await UserPlan.updateMany({ userId, isActive: true }, { $set: { isActive: false } });
console.log(UserPlan);
    const customPlan = new UserPlan({
      userId,
      name: 'Custom',
      price: price || 'Contact Us',
      maxApiKeys: maxApiKeys || 'Unlimited',
      support: support || 'Custom SLAs, bulk pricing, full support',
      description: 'Custom contracts, usage needs, and infrastructure.',
      limits,
      isActive: true,
      isCustom: true
    });

   await customPlan.save();

const toggles = {};
for (const serviceName of Object.keys(limits)) {
toggles[normalizeKey(serviceName)] = true;
}

await FeatureToggle.findOneAndUpdate(
  { userId },
  { $set: { toggles } },
  { upsert: true, new: true }
);


    res.status(201).json({
      code: 201,
      response: 'success',
      message: { info: 'Custom plan assigned' }
    });
  } catch (err) {
    console.error('❌ Error assigning custom plan:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});



// PUT /toggle-api-service
router.put('/toggle-api-service', authMiddleware, async (req, res) => {
  const { serviceName, enabled } = req.body;

  try {
    const toggleDoc = await FeatureToggle.findOne({ userId: req.user._id });

    if (!toggleDoc) {
      return res.status(404).json({
        code: 404,
        response: 'fail',
        message: 'Feature toggles not found'
      });
    }

   const key = normalizeKey(serviceName);

if (!toggleDoc.toggles.has(key)) {
  return res.status(400).json({
    code: 400,
    response: 'fail',
    message: 'Service not found in toggles'
  });
}

toggleDoc.toggles.set(key, enabled);
    await toggleDoc.save();

    res.json({
      code: 200,
      response: 'success',
      message: {
        updated: { name: serviceName, enabled },
        toggles: Object.fromEntries(toggleDoc.toggles) // return as plain object
      }
    });
  } catch (err) {
    console.error("❌ Error updating service toggle:", err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: err.message
    });
  }
});


module.exports = router;
