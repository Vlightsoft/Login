const mongoose = require('mongoose');
const UserPlan = require('../models/UserPlan'); // Adjust path if needed

// Replace with your actual connection string
const MONGO_URI = 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

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
    } else if (typeof plan.usage === 'object') {
      // fallback if plan.usage is a plain object
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
}).catch(err => {
  console.error('❌ Error:', err);
});
