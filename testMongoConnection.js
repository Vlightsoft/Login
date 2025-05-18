require('dotenv').config(); // Make sure you load .env file if you're using environment variables
const mongoose = require('mongoose');

// Your MongoDB URI (make sure MongoDB is running on localhost:27017 or your specific URI)
const MONGO_URI = 'mongodb+srv://admin:!A7ce58c2@vlightsoft.xhvhexr.mongodb.net/mydb?retryWrites=true&w=majority&appName=Vlightsoft';
;  // Example URI for local MongoDB

// Define a simple schema and model for testing
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Create a new user document
    const user = new User({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123'
    });

    // Save the user to the database
    user.save()
      .then(() => {
        console.log('✅ User inserted');
        mongoose.disconnect();  // Disconnect once done
      })
      .catch((err) => {
        console.error('❌ Error inserting user:', err);
        mongoose.disconnect();
      });
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
  });
