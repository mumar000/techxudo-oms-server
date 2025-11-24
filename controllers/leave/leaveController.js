import LeaveRequest from "../../models/LeaveRequest.js";
import User from "../../models/User.js";
import emailService from "../../services/email/emailService.js";
// Helper to calculate days between dates
const getDaysDiff = (start, end) => {
  const date1 = new Date(start);
  const date2 = new Date(end);
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
};

export const applyForLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason, attachments } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets req.user

    // Validate required fields
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "All required fields must be provided: type, startDate, endDate, reason"
      });
    }

    // Validate leave type
    const validTypes = ['casual', 'sick', 'annual', 'emergency'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid leave type. Valid types are: casual, sick, annual, emergency"
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    // 1. Validate Dates
    const daysRequested = getDaysDiff(startDate, endDate);

    // 2. Check for overlapping leave requests
    const existingLeaveRequests = await LeaveRequest.find({
      userId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });

    if (existingLeaveRequests.length > 0) {
      return res.status(400).json({
        message: "You have overlapping leave requests during this period"
      });
    }

    // 3. Check Balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = user.leaveBalances[type];

    if (currentBalance < daysRequested && type !== 'emergency') {
      return res.status(400).json({
        message: `Insufficient ${type} leave balance. You have ${currentBalance} days left.`
      });
    }

    // For sick leave, check if medical proof is required
    if (type === 'sick' && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        message: "Medical proof is required for sick leave"
      });
    }

    // 4. Create Request
    const leave = await LeaveRequest.create({
      userId,
      type,
      startDate,
      endDate,
      daysRequested,
      reason,
      attachments, // Array of Cloudinary URLs passed from frontend
      status: 'pending'
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error("Error in applyForLeave:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const adminId = req.user.id;

    // Validate status
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Valid statuses are: approved, rejected"
      });
    }

    const leave = await LeaveRequest.findById(id).populate('userId');
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: "Leave request is already processed" });
    }

    // Logic for Approval
    if (status === 'approved') {
      const user = await User.findById(leave.userId._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if enough balance exists (might have changed since request was made)
      if (user.leaveBalances[leave.type] < leave.daysRequested) {
        return res.status(400).json({
          message: `Insufficient ${leave.type} leave balance. Required: ${leave.daysRequested}, Available: ${user.leaveBalances[leave.type]}`
        });
      }

      // Deduct balance
      if (user.leaveBalances[leave.type] !== undefined) {
        user.leaveBalances[leave.type] -= leave.daysRequested;
        user.leaveUsage[`${leave.type}Used`] += leave.daysRequested;
        await user.save();
      }
    }

    leave.status = status;
    leave.adminComments = comments;
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    await leave.save();

    // Send Email
    await emailService.sendStatusUpdateEmail(
      leave.userId,
      "Leave Application",
      status,
      comments
    );

    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    console.error("Error in updateLeaveStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all leaves (Admin with filters, or Employee viewing own)
export const getLeaves = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { status } = req.query;

    let query = {};
    if (role !== 'admin') {
      query.userId = id; // Employee sees only their own
    }
    if (status) {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('userId', 'fullName designation email')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ message: "Leave request ID is required" });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    if (leave.userId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: "Cannot cancel approved/rejected request" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If approved, restore leave balance
    if (leave.status === 'approved') {
      if (user.leaveBalances[leave.type] !== undefined) {
        user.leaveBalances[leave.type] += leave.daysRequested;
        user.leaveUsage[`${leave.type}Used`] -= leave.daysRequested;
        await user.save();
      }
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({ message: "Leave request cancelled", leave });
  } catch (error) {
    console.error("Error in cancelLeaveRequest:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get leave balance for employee
export const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      casual: {
        total: user.leaveBalances.casual,
        used: user.leaveUsage.casualUsed,
        remaining: user.leaveBalances.casual - user.leaveUsage.casualUsed
      },
      sick: {
        total: user.leaveBalances.sick,
        used: user.leaveUsage.sickUsed,
        remaining: user.leaveBalances.sick - user.leaveUsage.sickUsed
      },
      annual: {
        total: user.leaveBalances.annual,
        used: user.leaveUsage.annualUsed,
        remaining: user.leaveBalances.annual - user.leaveUsage.annualUsed
      }
    });
  } catch (error) {
    console.error("Error in getLeaveBalance:", error);
    res.status(500).json({ message: error.message });
  }
};