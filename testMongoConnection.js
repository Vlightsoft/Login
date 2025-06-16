require('dotenv').config();
const mongoose = require('mongoose');

// Define the User schema inline (just for testing)
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  isApiEnabled: { type: Boolean, default: false },
  basePlanCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET);
console.log('🌐 MONGO_URI:', process.env.MONGO_URI ? '[Loaded successfully]' : '❌ Not loaded');
console.log('🚪 PORT:', process.env.PORT);

async function testDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'hashedpassword'
    });

    await testUser.save();
    console.log('✅ Test user inserted:', testUser);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testDatabase();
