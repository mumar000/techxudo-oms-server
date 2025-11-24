import {
  createTemplateService,
  getTemplatesService,
  getTemplateByIdService,
  checkTemplateAccess,
  updateTemplateService,
  deleteTemplateService,
  validateTemplatePlaceholders,
} from "../../services/documents/templateService.js";
import { validationResult } from "express-validator";

// Create document template
export const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, type, content } = req.body;

    const template = await createTemplateService(
      req.user._id,
      name,
      type,
      content
    );

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all templates
export const getTemplates = async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const templates = await getTemplatesService(req.user._id, req.user.role, {
      type,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await getTemplateByIdService(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Check authorization
    const hasAccess = checkTemplateAccess(
      template,
      req.user._id,
      req.user.role
    );
    if (!hasAccess) {
      if (req.user.role === "admin") {
        return res.status(403).json({
          success: false,
          error: "Access denied. You did not create this template.",
        });
      } else {
        return res.status(403).json({
          success: false,
          error: "Access denied. You cannot access this template.",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, content, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTemplate = await updateTemplateService(
      id,
      req.user._id,
      updateData
    );

    res.status(200).json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteTemplateService(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
