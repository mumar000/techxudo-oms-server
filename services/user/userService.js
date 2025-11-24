import User from "../../models/User.js";
import crypto from "crypto";

/**
 * User Service - Handles all user-related business logic
 */

class UserService {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @param {string} excludeFields - Fields to exclude from the result
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId, excludeFields = "") {
    try {
      const projection = excludeFields
        ? { $unset: excludeFields.split(" ") }
        : {};
      return await User.findById(userId).select(projection);
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async getUserByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      Object.keys(updateData).forEach((key) => {
        user[key] = updateData[key];
      });

      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  async deactivateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  /**
   * Activate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  async activateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: true },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error activating user: ${error.message}`);
    }
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {Promise<Object>} Result object with reset token or error message
   */
  async generatePasswordResetToken(email) {
    try {
      const user = await User.findOne({ email });

      // Always return success for security (don't reveal if email exists)
      if (!user) {
        return {
          success: true,
          message: "If the email exists, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      return {
        success: true,
        message: "Password reset link sent to your email.",
        resetToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
      };
    } catch (error) {
      throw new Error(
        `Error generating password reset token: ${error.message}`
      );
    }
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result object
   */
  async resetPasswordWithToken(token, newPassword) {
    try {
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Hash the token and find user
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Set new password
      user.passwordHash = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.refreshTokens = []; // Invalidate all refresh tokens
      await user.save();

      return {
        success: true,
        message:
          "Password reset successful. Please login with your new password.",
      };
    } catch (error) {
      throw new Error(`Error resetting password: ${error.message}`);
    }
  }

  /**
   * Add refresh token to user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to add
   * @returns {Promise<Object>} Updated user object
   */
  async addRefreshToken(userId, refreshToken) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $push: { refreshTokens: refreshToken } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding refresh token: ${error.message}`);
    }
  }

  /**
   * Remove refresh token from user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to remove
   * @returns {Promise<Object>} Updated user object
   */
  async removeRefreshToken(userId, refreshToken) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $pull: { refreshTokens: refreshToken } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error removing refresh token: ${error.message}`);
    }
  }

  /**
   * Remove all refresh tokens for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  async removeAllRefreshTokens(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { refreshTokens: [] },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error removing all refresh tokens: ${error.message}`);
    }
  }

  /**
   * Get all users with filtering, pagination, and sorting
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter criteria
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Paginated results
   */
  async getAllUsers({ filter = {}, page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Update allowed fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          user[key] = updateData[key];
        }
      });

      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      await user.deleteOne();
      return { deleted: true };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

export default new UserService();
