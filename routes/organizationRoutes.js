import express from "express";
import {
  registerOrganization,
  getCurrentOrganization,
  updateOrganization,
  completeSetup,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  addPolicy,
  updatePolicy,
  deletePolicy,
  getOrganizationStats
} from "../controllers/organization/organizationController.js";
import {
  validateRegisterOrganization,
  validateUpdateOrganization,
  validateCompleteSetup,
  validateAddDepartment,
  validateUpdateDepartment,
  validateDeleteDepartment,
  validateAddPolicy,
  validateUpdatePolicy,
  validateDeletePolicy
} from "../validators/organizationValidator.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { organizationContext } from "../middlewares/organizationContext.js";

const router = express.Router();

/**
 * 🌐 PUBLIC ROUTES
 */

/**
 * @route   POST /api/organization/register
 * @desc    Register new organization (public signup)
 * @access  Public
 */
router.post("/register", validateRegisterOrganization, registerOrganization);

/**
 * 🔐 PROTECTED ROUTES (Authentication Required)
 */

// Apply authentication middleware to all routes below
router.use(protect);

// Apply organization context middleware
router.use(organizationContext);

/**
 * @route   GET /api/organization/current
 * @desc    Get current organization details
 * @access  Private (All authenticated users)
 */
router.get("/current", getCurrentOrganization);

/**
 * @route   GET /api/organization/stats
 * @desc    Get organization statistics
 * @access  Private (Admin only)
 */
router.get("/stats", restrictTo("admin"), getOrganizationStats);

/**
 * 👔 ADMIN ONLY ROUTES
 */

/**
 * Organization Settings
 */
router.put(
  "/current",
  restrictTo("admin"),
  validateUpdateOrganization,
  updateOrganization
);

router.post(
  "/setup/complete",
  restrictTo("admin"),
  validateCompleteSetup,
  completeSetup
);

/**
 * Department Management
 */
router.post(
  "/departments",
  restrictTo("admin"),
  validateAddDepartment,
  addDepartment
);

router.put(
  "/departments/:departmentId",
  restrictTo("admin"),
  validateUpdateDepartment,
  updateDepartment
);

router.delete(
  "/departments/:departmentId",
  restrictTo("admin"),
  validateDeleteDepartment,
  deleteDepartment
);

/**
 * Policy Management
 */
router.post(
  "/policies",
  restrictTo("admin"),
  validateAddPolicy,
  addPolicy
);

router.put(
  "/policies/:policyId",
  restrictTo("admin"),
  validateUpdatePolicy,
  updatePolicy
);

router.delete(
  "/policies/:policyId",
  restrictTo("admin"),
  validateDeletePolicy,
  deletePolicy
);

export default router;
