import express from "express";
import {
  // Employee endpoints
  getMySalaryHistory,
  getMyCurrentSalary,
  getMySalarySummary,
  exportMySalary,
  // Admin endpoints
  getAllSalaryHistory,
  getSalaryById,
  createSalaryEntry,
  updateSalaryEntry,
  deleteSalaryEntry,
  lockSalaryEntry,
  bulkGenerateSalaries,
  getSalaryStatistics,
  exportAllSalaries
} from "../controllers/salary/salaryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================

/**
 * @route   GET /api/salary/my-history
 * @desc    Get my salary history
 * @access  Private (Employee)
 */
router.get("/my-history", authMiddleware, getMySalaryHistory);

/**
 * @route   GET /api/salary/my-current
 * @desc    Get current month salary
 * @access  Private (Employee)
 */
router.get("/my-current", authMiddleware, getMyCurrentSalary);

/**
 * @route   GET /api/salary/my-summary
 * @desc    Get salary summary for a year
 * @access  Private (Employee)
 */
router.get("/my-summary", authMiddleware, getMySalarySummary);

/**
 * @route   GET /api/salary/my-export
 * @desc    Export my salary history (PDF/CSV)
 * @access  Private (Employee)
 */
router.get("/my-export", authMiddleware, exportMySalary);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/salary/admin/all
 * @desc    Get all salary history with filters
 * @access  Private (Admin)
 */
router.get("/admin/all", authMiddleware, isAdmin, getAllSalaryHistory);

/**
 * @route   GET /api/salary/admin/statistics
 * @desc    Get salary statistics
 * @access  Private (Admin)
 */
router.get("/admin/statistics", authMiddleware, isAdmin, getSalaryStatistics);

/**
 * @route   GET /api/salary/admin/export
 * @desc    Export all salaries (PDF/CSV)
 * @access  Private (Admin)
 */
router.get("/admin/export", authMiddleware, isAdmin, exportAllSalaries);

/**
 * @route   GET /api/salary/admin/:id
 * @desc    Get salary by ID
 * @access  Private (Admin)
 */
router.get("/admin/:id", authMiddleware, isAdmin, getSalaryById);

/**
 * @route   POST /api/salary/admin/create
 * @desc    Create new salary entry
 * @access  Private (Admin)
 */
router.post("/admin/create", authMiddleware, isAdmin, createSalaryEntry);

/**
 * @route   POST /api/salary/admin/bulk-generate
 * @desc    Bulk generate salaries for all employees
 * @access  Private (Admin)
 */
router.post("/admin/bulk-generate", authMiddleware, isAdmin, bulkGenerateSalaries);

/**
 * @route   PUT /api/salary/admin/:id
 * @desc    Update salary entry
 * @access  Private (Admin)
 */
router.put("/admin/:id", authMiddleware, isAdmin, updateSalaryEntry);

/**
 * @route   POST /api/salary/admin/:id/lock
 * @desc    Lock salary entry (prevent further edits)
 * @access  Private (Admin)
 */
router.post("/admin/:id/lock", authMiddleware, isAdmin, lockSalaryEntry);

/**
 * @route   DELETE /api/salary/admin/:id
 * @desc    Delete salary entry
 * @access  Private (Admin)
 */
router.delete("/admin/:id", authMiddleware, isAdmin, deleteSalaryEntry);

export default router;
