const { mongoose, connectDB } = require('../db');
const UserPlan = require('../models/UserPlan');

(async () => {
  try {
    await connectDB(); // Use shared connection from db.js
    console.log('✅ Connected to MongoDB');

    const plans = await UserPlan.find({});
    let fixedCount = 0;

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
      } else if (typeof plan.usage === 'object') {
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
        fixedCount++;
        console.log(`✅ Fixed usage for userPlan: ${plan._id}`);
      }
    }

    console.log(`🎉 Done. ${fixedCount} plan(s) updated.`);
  } catch (err) {
    console.error('❌ Error fixing plans:', err);
  } finally {
    mongoose.disconnect();
  }
})();
