import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@techxudo.com" });

    if (adminExists) {
      console.log("⚠️  Admin user already exists!");
      console.log("📧 Email: admin@techxudo.com");
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      fullName: "Syed Talha Shah",
      email: "admin@techxudo.com",
      passwordHash: "Admin@123", // Will be hashed by pre-save hook
      role: "admin",
      designation: "System Administrator",
      department: "IT",
      joiningDate: new Date(),
      isActive: true,
      isEmailVerified: true,
    });

    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: admin@techxudo.com");
    console.log("🔑 Password: Admin@123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚡ You can now login with these credentials");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
