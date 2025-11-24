import UserService from "../services/user/userService.js";

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const result = await UserService.getAllUsers({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching users",
    });
  }
};

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
export const getUserById = async (req, res) => {
  try {
    const result = await UserService.getUserById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching user",
    });
  }
};

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, designation, department, salary, phone, joiningDate, isActive, role } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (salary !== undefined) updateData.salary = salary;
    if (phone !== undefined) updateData.phone = phone;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    const result = await UserService.updateUser(req.params.id, updateData);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while updating user",
    });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const result = await UserService.deleteUser(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while deleting user",
    });
  }
};

/**
 * @desc    Block user (Admin only)
 * @route   POST /api/users/:id/block
 * @access  Private (Admin)
 */
export const blockUser = async (req, res) => {
  try {
    const result = await UserService.deactivateUser(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: result,
    });
  } catch (error) {
    console.error("Block user error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while blocking user",
    });
  }
};

/**
 * @desc    Unblock user (Admin only)
 * @route   POST /api/users/:id/unblock
 * @access  Private (Admin)
 */
export const unblockUser = async (req, res) => {
  try {
    const result = await UserService.activateUser(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: result,
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while unblocking user",
    });
  }
};