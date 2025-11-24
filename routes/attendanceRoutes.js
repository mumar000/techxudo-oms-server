import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

// Employee controllers
import {
  checkIn,
  checkOut,
  getMyTodayAttendance,
  getMyAttendance,
  getMyStats,
  requestCorrection,
  getMyCorrectionRequests,
} from "../controllers/attendance/attendanceController.js";

// Admin controllers
import {
  generateQRCode,
  getAllAttendance,
  getEmployeeAttendance,
  manualAttendanceEntry,
  updateAttendance,
  deleteAttendance,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getDashboardStats,
  getCorrectionRequests,
  reviewCorrectionRequest,
  getSettings,
  updateSettings,
} from "../controllers/attendance/adminAttendanceController.js";

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================
// All employee routes require authentication
router.use(authMiddleware);

// Check-in / Check-out
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);

// Get attendance
router.get("/my-today", getMyTodayAttendance);
router.get("/my-attendance", getMyAttendance);
router.get("/my-stats", getMyStats);

// Correction requests
router.post("/request-correction", requestCorrection);
router.get("/my-requests", getMyCorrectionRequests);

// ==================== ADMIN ROUTES ====================
// All admin routes require admin role
const adminRouter = express.Router();
adminRouter.use(isAdmin);

// QR Code
adminRouter.get("/generate-qr", generateQRCode);

// Attendance management
adminRouter.get("/all", getAllAttendance);
adminRouter.get("/employee/:userId", getEmployeeAttendance);
adminRouter.post("/manual-entry", manualAttendanceEntry);
adminRouter.put("/:id", updateAttendance);
adminRouter.delete("/:id", deleteAttendance);

// Reports
adminRouter.get("/reports/daily", getDailyReport);
adminRouter.get("/reports/weekly", getWeeklyReport);
adminRouter.get("/reports/monthly", getMonthlyReport);

// Statistics
adminRouter.get("/statistics/dashboard", getDashboardStats);

// Correction requests
adminRouter.get("/corrections", getCorrectionRequests);
adminRouter.put("/corrections/:id", reviewCorrectionRequest);

// Settings
adminRouter.get("/settings", getSettings);
adminRouter.put("/settings", updateSettings);

// Mount admin routes
router.use("/admin", adminRouter);

export default router;
