import express from "express";
import {
  requestDocument,
  generateDocument,
  getRequestDocuments,
  downloadDocument,
  cancelDocumentRequest,
} from "../controllers/request/requestController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, requestDocument);
router.get("/", authMiddleware, getRequestDocuments);
router.post("/:id/generate", authMiddleware, isAdmin, generateDocument);
router.get("/:id/download", authMiddleware, downloadDocument);
router.delete("/:id", authMiddleware, cancelDocumentRequest);

export default router;
