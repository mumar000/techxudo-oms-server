import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import AttendanceRequest from "../models/AttendanceRequest.js";
import Onboarding from "../models/Onboarding.js";
import User from "../models/User.js";
import AttendanceSettings from "../models/AttendanceSettings.js";

const migrateOrganizationId = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/techxudo-oms");
    console.log("Connected to MongoDB");

    // Migrate Attendance records
    console.log("Migrating Attendance records...");
    const attendanceRecords = await Attendance.find({ organizationId: { $exists: false } });

    for (const record of attendanceRecords) {
      if (record.userId) {
        const user = await User.findById(record.userId).select('organizationId');
        if (user && user.organizationId) {
          await Attendance.findByIdAndUpdate(
            record._id,
            { organizationId: user.organizationId }
          );
        }
      }
    }
    console.log(`Migrated ${attendanceRecords.length} Attendance records`);

    // Migrate AttendanceRequest records
    console.log("Migrating AttendanceRequest records...");
    const attendanceRequestRecords = await AttendanceRequest.find({ organizationId: { $exists: false } });

    for (const record of attendanceRequestRecords) {
      if (record.userId) {
        const user = await User.findById(record.userId).select('organizationId');
        if (user && user.organizationId) {
          await AttendanceRequest.findByIdAndUpdate(
            record._id,
            { organizationId: user.organizationId }
          );
        }
      }
    }
    console.log(`Migrated ${attendanceRequestRecords.length} AttendanceRequest records`);

    // Migrate Onboarding records
    console.log("Migrating Onboarding records...");
    const onboardingRecords = await Onboarding.find({ organizationId: { $exists: false } });

    for (const record of onboardingRecords) {
      if (record.employeeId) {
        const user = await User.findById(record.employeeId).select('organizationId');
        if (user && user.organizationId) {
          await Onboarding.findByIdAndUpdate(
            record._id,
            { organizationId: user.organizationId }
          );
        }
      }
    }
    console.log(`Migrated ${onboardingRecords.length} Onboarding records`);

    // Migrate AttendanceSettings records (for existing global settings, we'll need to assign to default organization)
    console.log("Migrating AttendanceSettings records...");
    const globalSettings = await AttendanceSettings.find({ organizationId: { $exists: false } });

    if (globalSettings.length > 0) {
      console.log("Found global AttendanceSettings. These will need manual assignment to organizations.");
      console.log("You can either assign them to a default organization or create settings for each organization.");
      console.log("For now, we'll skip migration of global settings. You may need to create them for each organization.");
    }
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateOrganizationId();