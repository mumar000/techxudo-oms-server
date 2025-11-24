import express from "express";
import { applyForLeave, updateLeaveStatus, getLeaves, cancelLeaveRequest, getLeaveBalance } from "../controllers/leave/leaveController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, applyForLeave);
router.get("/", authMiddleware, getLeaves);
router.put("/:id/status", authMiddleware, isAdmin, updateLeaveStatus);
router.delete("/:id", authMiddleware, cancelLeaveRequest);
router.get("/balance", authMiddleware, getLeaveBalance);

export default router;