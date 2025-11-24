import express from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "../controllers/documents/templateController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";
import { body } from "express-validator";

const router = express.Router();

// Create document template
router
  .route("/")
  .post(
    authMiddleware,
    isAdmin,
    [
      body("name").notEmpty().withMessage("Template name is required"),
      body("type").notEmpty().withMessage("Template type is required"),
      body("content").notEmpty().withMessage("Template content is required"),
    ],
    createTemplate
  )
  .get(authMiddleware, isAdmin, getTemplates); // Only admins can see templates

// Template by ID routes
router
  .route("/:id")
  .get(authMiddleware, isAdmin, getTemplateById)
  .put(
    authMiddleware,
    isAdmin,
    [
      body("name").optional().notEmpty(),
      body("type").optional().isIn(["contract", "nda", "undertaking"]),
      body("content").optional().notEmpty(),
    ],
    updateTemplate
  )
  .delete(authMiddleware, isAdmin, deleteTemplate);

export default router;
