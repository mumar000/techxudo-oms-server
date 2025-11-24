import express from "express";
import {
  createDocumentFromTemplate,
  uploadDocument,
  getDocuments,
  getPendingDocuments,
  getDocumentById,
  signDocument,
  declineDocument,
  resendDocument,
  deleteDocument,
} from "../controllers/documents/documentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin, isEmployee } from "../middlewares/roleMiddleware.js";
import { body } from "express-validator";
import upload from "../config/multerConfig.js";

const router = express.Router();

router
  .route("/generate")
  .post(
    authMiddleware,
    isAdmin,
    [
      body("templateId").notEmpty().withMessage("Template ID is required"),
      body("employeeId").notEmpty().withMessage("Employee ID is required"),
    ],
    createDocumentFromTemplate
  );

// Upload custom document
router.route("/upload").post(authMiddleware, isAdmin, uploadDocument);

router.route("/").get(authMiddleware, getDocuments);

// Get pending documents for employee
router
  .route("/employee/pending")
  .get(authMiddleware, isEmployee, getPendingDocuments);

// Document by ID routes
router
  .route("/:id")
  .get(authMiddleware, getDocumentById)
  .delete(authMiddleware, isAdmin, deleteDocument);

// Document signing routes
router
  .route("/:id/sign")
  .post(
    authMiddleware,
    isEmployee,
    [
      body("signatureImage")
        .notEmpty()
        .withMessage("Signature image is required"),
    ],
    signDocument
  );

router
  .route("/:id/decline")
  .post(
    authMiddleware,
    isEmployee,
    [body("reason").optional().isString()],
    declineDocument
  );

router.route("/:id/resend").post(authMiddleware, isAdmin, resendDocument);

export default router;
