import organizationService from "../../services/organization-services/organizationService.js";

export const registerOrganization = async (req, res) => {
  try {
    const result = await organizationService.createOrganization(req.body);

    res.status(201).json({
      success: true,
      message: "Organization registered Successfully",
      data: result,
    });
  } catch (error) {
    console.log("Register organization error", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to register organization",
    });
  }
};

/**
 * @route GET /api/organization/current
 * @access Private
 */
export const getCurrentOrganization = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization details",
    });
  }
};

/**
 * @route PUT /api/organization/current
 * @access Private (Admin only)
 */
export const updateOrganization = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const updatedOrganization = await organizationService.updateOrganization(
      organizationId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update organization",
    });
  }
};

/**
 * @route POST /api/organization/setup/complete
 * @access Private (Admin only)
 */
export const completeSetup = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const setupData = req.body;

    const completedOrganization = await organizationService.completeSetup(
      organizationId,
      setupData
    );

    res.status(200).json({
      success: true,
      message: "Organization setup completed successfully",
      data: completedOrganization,
    });
  } catch (error) {
    console.error("Complete setup error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to complete setup",
    });
  }
};

/**
 * @route GET /api/organization/stats
 * @access Private (Admin only)
 */
export const getOrganizationStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const stats =
      await organizationService.getOrganizationStats(organizationId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get organization stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization statistics",
    });
  }
};

/**
 * DEPARTMENT MANAGEMENT
 */

/**
 * @route POST /api/organization/departments
 * @access Private (Admin only)
 */
export const addDepartment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const departmentData = req.body;

    const updatedOrganization = await organizationService.addDepartment(
      organizationId,
      departmentData
    );

    res.status(201).json({
      success: true,
      message: "Department added successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Add department error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add department",
    });
  }
};

/**
 * @route PUT /api/organization/departments/:departmentId
 * @access Private (Admin only)
 */
export const updateDepartment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { departmentId } = req.params;
    const updateData = req.body;

    const updatedOrganization = await organizationService.updateDepartment(
      organizationId,
      departmentId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update department",
    });
  }
};

/**
 * @route DELETE /api/organization/departments/:departmentId
 * @access Private (Admin only)
 */
export const deleteDepartment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { departmentId } = req.params;

    const updatedOrganization = await organizationService.deleteDepartment(
      organizationId,
      departmentId
    );

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete department",
    });
  }
};

/**
 * POLICY MANAGEMENT
 */

/**
 * @route POST /api/organization/policies
 * @access Private (Admin only)
 */
export const addPolicy = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const policyData = req.body;

    const updatedOrganization = await organizationService.addPolicy(
      organizationId,
      policyData
    );

    res.status(201).json({
      success: true,
      message: "Policy added successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Add policy error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add policy",
    });
  }
};

/**
 * @route PUT /api/organization/policies/:policyId
 * @access Private (Admin only)
 */
export const updatePolicy = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { policyId } = req.params;
    const updateData = req.body;

    const updatedOrganization = await organizationService.updatePolicy(
      organizationId,
      policyId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Policy updated successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Update policy error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update policy",
    });
  }
};

/**
 * @route DELETE /api/organization/policies/:policyId
 * @access Private (Admin only)
 */
export const deletePolicy = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { policyId } = req.params;

    const updatedOrganization = await organizationService.deletePolicy(
      organizationId,
      policyId
    );

    res.status(200).json({
      success: true,
      message: "Policy deleted successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    console.error("Delete policy error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete policy",
    });
  }
};
