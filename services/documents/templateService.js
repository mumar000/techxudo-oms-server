import DocumentTemplate from "../../models/DocumentTemplate.js";

// Create document template
export const createTemplateService = async (userId, name, type, content) => {
  // Find placeholders in the content
  const placeholders = content.match(/\\{\\{[^}]+\\}\\}/g) || [];

  const template = new DocumentTemplate({
    name,
    type,
    content,
    placeholders: [...new Set(placeholders)], // Remove duplicates
    createdBy: userId,
  });

  await template.save();
  return template;
};

// Get all templates for a user
export const getTemplatesService = async (userId, userRole, options = {}) => {
  let query = { isActive: true };

  // Admins can see templates they created, others see active templates
  if (userRole === "admin") {
    query.createdBy = userId;
  }

  // Add any additional query conditions from options
  if (options.type) {
    query.type = options.type;
  }
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  const templates = await DocumentTemplate.find(query)
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });

  return templates;
};

// Get template by ID
export const getTemplateByIdService = async (templateId) => {
  const template = await DocumentTemplate.findById(templateId).populate(
    "createdBy",
    "fullName email"
  );

  return template;
};

// Check template access authorization
export const checkTemplateAccess = (template, userId, userRole) => {
  if (userRole === "admin") {
    // Admin can access templates they created
    return template.createdBy.toString() === userId.toString();
  }
  // For employees, we might want to check if template is active and shared
  // For now, employees cant access templates directly
  return false;
};

// Update template
export const updateTemplateService = async (templateId, userId, updateData) => {
  const template = await DocumentTemplate.findById(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  // Check authorization
  if (template.createdBy.toString() !== userId.toString()) {
    throw new Error("Only template creator can update");
  }

  // Find placeholders in the content if content is being updated
  if (updateData.content) {
    const placeholders = updateData.content.match(/\\{\\{[^}]+\\}\\}/g) || [];
    updateData.placeholders = [...new Set(placeholders)]; // Update placeholders if content changed
  }

  const updatedTemplate = await DocumentTemplate.findByIdAndUpdate(
    templateId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("createdBy", "fullName email");

  return updatedTemplate;
};

// Delete template
export const deleteTemplateService = async (templateId, userId) => {
  const template = await DocumentTemplate.findById(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  // Check authorization
  if (template.createdBy.toString() !== userId.toString()) {
    throw new Error("Only template creator can delete");
  }

  await DocumentTemplate.findByIdAndDelete(templateId);
  return true;
};

// Validate template placeholders
export const validateTemplatePlaceholders = (
  content,
  requiredPlaceholders = []
) => {
  const foundPlaceholders = content.match(/\\{\\{[^}]+\\}\\}/g) || [];

  // Check if all required placeholders are present
  const missingPlaceholders = requiredPlaceholders.filter(
    (placeholder) => !foundPlaceholders.includes(placeholder)
  );

  return {
    isValid: missingPlaceholders.length === 0,
    foundPlaceholders,
    missingPlaceholders,
  };
};
