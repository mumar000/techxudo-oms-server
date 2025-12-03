import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided, authorization denied",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select(
      "-passwordHash -refreshTokens -passwordResetToken -emailVerificationToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found, token is not valid",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};

/**
 * 🔐 Named export for new routes (alias for authMiddleware)
 */
export const protect = authMiddleware;

/**
 * 🛡️ Role-based access control middleware
 * Usage: restrictTo("admin") or restrictTo("admin", "employee")
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action"
      });
    }

    next();
  };
};

// Keep default export for backward compatibility
export default authMiddleware;
