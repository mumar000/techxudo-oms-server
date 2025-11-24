/**
 * Attendance Module Setup Script
 * Run this once to initialize attendance settings and create necessary data
 *
 * Usage: node scripts/setupAttendance.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import AttendanceSettings from "../models/AttendanceSettings.js";
import connectDB from "../config/db.js";

dotenv.config();

const setupAttendanceModule = async () => {
  try {
    console.log("🚀 Starting Attendance Module Setup...\n");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database\n");

    // Check if settings already exist
    const existingSettings = await AttendanceSettings.findOne();

    if (existingSettings) {
      console.log("⚠️  Attendance settings already exist!");
      console.log("Current settings:");
      console.log(JSON.stringify(existingSettings, null, 2));
      console.log("\nSkipping setup. Delete existing settings first if you want to recreate.\n");
      process.exit(0);
    }

    // Create default attendance settings
    const defaultSettings = {
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      holidays: [
        {
          date: new Date("2025-01-01"),
          name: "New Year's Day",
          type: "public"
        },
        {
          date: new Date("2025-12-25"),
          name: "Christmas Day",
          type: "public"
        }
      ],
      defaultShift: {
        startTime: "09:00",
        endTime: "18:00",
        graceTime: 15, // 15 minutes grace period
        minimumHours: 8 // Minimum hours for full day
      },
      qrCode: {
        enabled: true,
        secret: process.env.ATTENDANCE_QR_SECRET || "default-secret-change-me",
        expiryMinutes: 5, // QR code valid for 5 minutes
        officeCode: process.env.ATTENDANCE_OFFICE_CODE || "TECHXUDO_HQ"
      },
      ipWhitelist: {
        enabled: false,
        allowedIPs: []
      },
      geofencing: {
        enabled: false,
        officeLocations: [
          {
            name: "Head Office",
            latitude: 0,
            longitude: 0,
            radius: 100 // 100 meters
          }
        ]
      },
      notifications: {
        absenteeAlert: true,
        lateArrivalAlert: true,
        missedCheckoutAlert: true
      },
      autoMarkAbsent: {
        enabled: true,
        afterTime: "10:00" // Auto-mark absent at 10:00 AM
      }
    };

    const settings = await AttendanceSettings.create(defaultSettings);

    console.log("✅ Attendance settings created successfully!\n");
    console.log("📋 Settings Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Working Days: ${settings.workingDays.join(", ")}`);
    console.log(`Shift Time: ${settings.defaultShift.startTime} - ${settings.defaultShift.endTime}`);
    console.log(`Grace Period: ${settings.defaultShift.graceTime} minutes`);
    console.log(`QR Code Enabled: ${settings.qrCode.enabled}`);
    console.log(`QR Expiry: ${settings.qrCode.expiryMinutes} minutes`);
    console.log(`Office Code: ${settings.qrCode.officeCode}`);
    console.log(`Auto-mark Absent: ${settings.autoMarkAbsent.enabled} at ${settings.autoMarkAbsent.afterTime}`);
    console.log(`Holidays Configured: ${settings.holidays.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("⚠️  IMPORTANT SECURITY NOTES:");
    console.log("1. Change ATTENDANCE_QR_SECRET in your .env file");
    console.log("2. Update ATTENDANCE_OFFICE_CODE in your .env file");
    console.log("3. Configure SMTP settings for email notifications");
    console.log("4. Review and update holidays in the database\n");

    console.log("📝 Next Steps:");
    console.log("1. Configure email settings in .env:");
    console.log("   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD");
    console.log("2. Start the server: npm start");
    console.log("3. Cron jobs will start automatically");
    console.log("4. Access admin panel to customize settings\n");

    console.log("✨ Setup complete! Attendance module is ready to use.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run setup
setupAttendanceModule();
