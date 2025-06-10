const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const PlanInfo = require('../models/PlanInfo');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mongoose } = require('../db');  // Ensure db.js is correctly imported



// 🛡 Helper: check if MongoDB is connected before running a DB operation
function checkMongoConnection(res) {
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected! readyState:', mongoose.connection.readyState);
    res.status(503).json({ code: 503, response: "error", message: "Service unavailable. DB not connected." });
    return false;
  }
  return true;
}

// 🔐 Middleware to verify JWT token and load user data
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      response: "error",
      message: { error: "No token provided" }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        code: 404,
        response: "error",
        message: { error: "User not found" }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({
      code: 403,
      response: "error",
      message: { error: "Invalid token" }
    });
  }
};
// 🧾  upload profile route
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_profile${ext}`);
  }
});
const upload = multer({ storage });

// Upload profile picture
router.post('/user/upload-profile-pic', authMiddleware, upload.single('profilePic'), async (req, res) => {
  console.log("🔔 Upload route triggered");
  console.log("📷 File received:", req.file); // 👈 Add this line

  if (!req.file) {
    return res.status(400).json({ code: 400, response: 'fail', message: { error: 'No file uploaded' } });
  }

  const profileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  req.user.profilePicUrl = profileUrl;
  await req.user.save();

  res.json({
    code: 200,
    response: 'success',
    message: { profilePicUrl: profileUrl }
  });
});


// 🧾 Signup Route
router.post('/signup', async (req, res) => {
  if (!checkMongoConnection(res)) return;

  const { username, email, password } = req.body;
  console.log("📥 Signup request body:", req.body);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        response: "fail",
        message: { error: "User already exists" }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log("✅ New user created:", user.email);

    res.status(201).json({
      code: 201,
      response: "success",
      message: { userId: user._id }
    });
  } catch (err) {
    console.error("❌ Error in signup:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: { error: err.message }
    });
  }
});

// 🔐 Login Route
router.post('/login', async (req, res) => {
  if (!checkMongoConnection(res)) return;

  const { email, password } = req.body;
  console.log("📥 Login request body:", req.body);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        code: 401,
        response: "error",
        message: { error: "Invalid credentials" }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        response: "error",
        message: { error: "Invalid credentials" }
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log("✅ Login successful for:", email);
    res.json({
      code: 200,
      response: "success",
      message: {
        info: "Login successful",
        sessionToken: token
      }
    });
  } catch (err) {
    console.error("❌ Error in login:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: { error: err.message }
    });
  }
});

// 🧾 Get User Info Route (GET /user)
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      code: 200,
      response: "success",
      //message: { username: user.username, email: user.email ,date:"12/05/1995"}
      message: {
    _id: user._id,
    username: user.username ?? null,
    email: user.email ?? null,
    profilePicUrl: user.profilePicUrl ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    phone: user.phone ?? null,
    organizationName: user.organizationName ?? null
  }
    });
  } catch (err) {
    console.error("❌ Error in get user info:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: { error: err.message }
    });
  }
});


// 🧾 Update User Info Route (PUT /user)
router.put('/user', authMiddleware, async (req, res) => {
  const { username, email, password, dateOfBirth, phone, organizationName} = req.body;
  try {
    // Validate fields
    if (!username || !email) {
      return res.status(400).json({
        code: 400,
        response: "error",
        message: { error: "Username and email are required" }
      });
    }

    const user = req.user;
    user.username = username;
    user.email = email;


    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (phone) user.phone = phone;
    if (organizationName) user.organizationName = organizationName;
   
    await user.save();


    res.json({
      code: 200,
      response: "success",
      message: { info: "User info updated successfully" }
    });
  } catch (err) {
    console.error("❌ Error in update user info:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: { error: err.message }
    });
  }
});


// 🧾 Get User Login History Route (GET /user/login-history)
router.get('/user/login-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const loginHistory = await LoginHistory.find({ userId }).sort({ loginTime: -1 });

    res.json({
      code: 200,
      response: "success",
      message: { loginHistory }
    });
  } catch (err) {
    console.error("❌ Error in getting login history:", err.message);
    res.status(500).json({
      code: 500,
      response: "error",
      message: { error: err.message }
    });
  }
});

router.post('/user/plan-info', authMiddleware, async (req, res) => {
  try {
    const { planName, basePlanCost, totalCost, expiryDate } = req.body;

    if (!planName || !basePlanCost || !totalCost) {
      return res.status(400).json({
        code: 400,
        response: 'error',
        message: { error: 'Plan name, base plan cost, and total cost are required' },
      });
    }

    // Create a new PlanInfo document
    const newPlan = new PlanInfo({
      userId: req.user._id, // User ID from JWT token
      planName,
      basePlanCost,
      totalCost,
      expiryDate,
      isActive: true, // Set this plan as active
    });

    // Save the plan (the pre-save hook will deactivate any existing active plans)
    await newPlan.save();

    res.status(201).json({
      code: 201,
      response: 'success',
      message: { info: 'Plan created successfully', planId: newPlan._id },
    });
  } catch (err) {
    console.error('❌ Error in creating plan:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: { error: err.message },
    });
  }
});


// 🧾 Get User Plan Info Route (GET /user/plan-info)
// 🧾 Get Active Plan Info Route (GET /user/plan-info/active)
router.get('/user/plan-info/active', authMiddleware, async (req, res) => {
  try {
    // Find the active plan for the current user
    const activePlan = await PlanInfo.findOne({ userId: req.user._id, isActive: true });

    if (!activePlan) {
      return res.status(404).json({
        code: 404,
        response: 'error',
        message: { error: 'No active plan found' },
      });
    }

    res.status(200).json({
      code: 200,
      response: 'success',
      message: {
        planId: activePlan._id,
        planName: activePlan.planName,
        basePlanCost: activePlan.basePlanCost,
        totalCost: activePlan.totalCost,
        startDate: activePlan.startDate,
        expiryDate: activePlan.expiryDate,
      },
    });
  } catch (err) {
    console.error('❌ Error in getting active plan:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: { error: err.message },
    });
  }
});


router.put('/user/plan-info', authMiddleware, async (req, res) => {
  const { planId, planName, basePlanCost, totalCost, expiryDate, isActive } = req.body;

  try {
    if (!planId) {
      return res.status(400).json({
        code: 400,
        response: 'error',
        message: { error: 'Plan ID is required' },
      });
    }

    // Find the plan by its ID
    const plan = await PlanInfo.findById(planId);

    if (!plan) {
      return res.status(404).json({
        code: 404,
        response: 'error',
        message: { error: 'Plan not found' },
      });
    }

    // Only one active plan per user
    if (isActive) {
      // Deactivate all other active plans for this user
      await PlanInfo.updateMany(
        { userId: req.user._id, isActive: true },
        { $set: { isActive: false } }
      );
    }

    // Update the plan details
    plan.planName = planName || plan.planName;
    plan.basePlanCost = basePlanCost || plan.basePlanCost;
    plan.totalCost = totalCost || plan.totalCost;
    plan.expiryDate = expiryDate || plan.expiryDate;
    plan.isActive = isActive || plan.isActive;

    // Save the updated plan
    await plan.save();

    res.status(200).json({
      code: 200,
      response: 'success',
      message: { info: 'Plan info updated successfully' },
    });
  } catch (err) {
    console.error('❌ Error in updating plan:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: { error: err.message },
    });
  }
});

// 🧾 Get All Plans Info Route (GET /user/plan-info/all)
router.get('/user/plan-info/all', authMiddleware, async (req, res) => {
  try {
    // Find all plans for the current user
    const plans = await PlanInfo.find({ userId: req.user._id });

    if (plans.length === 0) {
      return res.status(404).json({
        code: 404,
        response: 'error',
        message: { error: 'No plans found for this user' },
      });
    }

    // Map over the plans to structure the response
    const formattedPlans = plans.map((plan) => ({
      planId: plan._id,
      planName: plan.planName,
      basePlanCost: plan.basePlanCost,
      totalCost: plan.totalCost,
      startDate: plan.startDate,
      expiryDate: plan.expiryDate,
      isActive: plan.isActive,
    }));

    res.status(200).json({
      code: 200,
      response: 'success',
      message: { plans: formattedPlans },
    });
  } catch (err) {
    console.error('❌ Error in getting all plans:', err.message);
    res.status(500).json({
      code: 500,
      response: 'error',
      message: { error: err.message },
    });
  }
});

module.exports = router;
