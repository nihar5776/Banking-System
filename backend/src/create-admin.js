require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./models/userModel');

async function createAdmin() {
  try {
    const mongoUri = process.env.Mongo_URI;
    if (!mongoUri) {
      console.error("Mongo_URI is missing from backend/.env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const email = 'niharni02@gmail.com';
    const password = 'AdminPassword123!';
    const name = 'Admin User';

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log("User already exists. Upgrading to systemUser...");
      
      // Use direct collection update to bypass mongoose 'immutable' validation rule
      await userModel.collection.updateOne(
        { email },
        { $set: { systemUser: true, isVerified: true } }
      );
      console.log("User successfully upgraded to Admin.");
    } else {
      console.log("Creating new Admin User...");
      const admin = new userModel({
        email,
        password,
        name,
        isVerified: true,
        systemUser: true
      });
      await admin.save();
      console.log("Admin User created successfully.");
    }
    
    mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error in createAdmin:", error);
    process.exit(1);
  }
}

createAdmin();
