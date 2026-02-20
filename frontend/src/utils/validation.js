/**
 * Form validation utilities
 */

export const validateProposalForm = (formData) => {
  const errors = {};

  // Title validation
  if (!formData.title || formData.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  }
  if (formData.title && formData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  // Project idea validation
  if (!formData.project_idea || formData.project_idea.trim().length < 50) {
    errors.project_idea = 'Project description must be at least 50 characters long';
  }
  if (formData.project_idea && formData.project_idea.length > 5000) {
    errors.project_idea = 'Project description must be less than 5000 characters';
  }

  // Lead organization validation
  if (!formData.lead_organization?.name || formData.lead_organization.name.trim().length < 2) {
    errors.lead_organization_name = 'Lead organization name is required';
  }
  if (!formData.lead_organization?.country || formData.lead_organization.country.trim().length < 2) {
    errors.lead_organization_country = 'Lead organization country is required';
  }
  if (!formData.lead_organization?.type) {
    errors.lead_organization_type = 'Lead organization type is required';
  }

  // Partner organizations validation - now optional since details can be added later
  // Partners can be added during proposal development phase

  // EU Priorities validation
  if (!formData.selected_priorities || formData.selected_priorities.length === 0) {
    errors.selected_priorities = 'Please select at least one EU priority';
  }
  if (formData.selected_priorities && formData.selected_priorities.length > 3) {
    errors.selected_priorities = 'Please select no more than 3 priorities for focused project';
  }

  // Target groups validation
  if (!formData.target_groups ||
      (Array.isArray(formData.target_groups) && formData.target_groups.length === 0) ||
      (typeof formData.target_groups === 'string' && formData.target_groups.trim().length === 0)) {
    errors.target_groups = 'Please specify target groups for your project';
  }

  // Optional field validation (non-blocking, informational only)
  // Lead org website format check
  if (formData.lead_organization?.website && formData.lead_organization.website.trim() &&
      !/^https?:\/\/.+/.test(formData.lead_organization.website.trim())) {
    errors.lead_organization_website = 'Website should start with http:// or https://';
  }

  // Beneficiary counts should be positive if provided
  if (formData.primary_target_count && Number(formData.primary_target_count) < 0) {
    errors.primary_target_count = 'Number of beneficiaries must be positive';
  }
  if (formData.secondary_target_count && Number(formData.secondary_target_count) < 0) {
    errors.secondary_target_count = 'Number of beneficiaries must be positive';
  }

  // Duration validation
  if (!formData.duration_months || formData.duration_months < 6 || formData.duration_months > 36) {
    errors.duration_months = 'Project duration must be between 6 and 36 months';
  }

  // Budget validation
  const validBudgets = [120000, 250000, 400000];
  if (!formData.budget_eur || !validBudgets.includes(formData.budget_eur)) {
    errors.budget_eur = 'Please select a valid budget level (€120,000, €250,000, or €400,000)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak'
  };
};

export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, hyphens and underscores' };
  }
  return { isValid: true };
};
