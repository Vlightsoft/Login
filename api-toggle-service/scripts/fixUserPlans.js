require('dotenv').config();
const { connectDB, mongoose } = require('../db');
const UserPlan = require('../models/UserPlan');

(async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const plans = await UserPlan.find({});

    for (const plan of plans) {
      let modified = false;

      if (plan.usage instanceof Map) {
        for (const [service, value] of plan.usage.entries()) {
          if (typeof value === 'object' && value !== null) {
            const total = Object.values(value).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
            plan.usage.set(service, total);
            modified = true;
          }
        }
      } else if (typeof plan.usage === 'object' && plan.usage !== null) {
        for (const service in plan.usage) {
          const value = plan.usage[service];
          if (typeof value === 'object') {
            const total = Object.values(value).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
            plan.usage[service] = total;
            modified = true;
          }
        }
      }

      if (modified) {
        plan.markModified('usage');
        await plan.save();
        console.log(`✅ Fixed usage for userPlan: ${plan._id}`);
      }
    }

    console.log('✅ All plans checked and fixed.');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error fixing plans:', err);
    process.exit(1);
  }
})();
