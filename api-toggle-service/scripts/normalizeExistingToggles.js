const mongoose = require('mongoose');

// ✅ Replace with your actual URI
const MONGO_URI = 'mongodb+srv://admin:!A7ce58c2@vlightsoft.xhvhexr.mongodb.net/?retryWrites=true&w=majority&appName=Vlightsoft';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🚨 Connected. Wiping collections...');

  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    try {
      await collection.deleteMany({});
      console.log(`🧹 Cleared ${collection.collectionName}`);
    } catch (err) {
      console.error(`❌ Failed to clear ${collection.collectionName}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('✅ All collections cleared. Database is now clean.');
}).catch(console.error);
