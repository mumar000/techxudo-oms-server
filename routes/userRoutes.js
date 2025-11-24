import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin only routes for user management
router.get("/", authMiddleware, isAdmin, userController.getAllUsers);
router.get("/:id", authMiddleware, isAdmin, userController.getUserById);
router.put("/:id", authMiddleware, isAdmin, userController.updateUser);
router.delete("/:id", authMiddleware, isAdmin, userController.deleteUser);
router.post("/:id/block", authMiddleware, isAdmin, userController.blockUser);
router.post(
  "/:id/unblock",
  authMiddleware,
  isAdmin,
  userController.unblockUser
);

export default router;
