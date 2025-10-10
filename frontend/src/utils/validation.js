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

  // Partner organizations validation
  if (!formData.partner_organizations || formData.partner_organizations.length < 2) {
    errors.partner_organizations = 'At least 2 partner organizations are required for Erasmus+ projects';
  } else {
    formData.partner_organizations.forEach((partner, index) => {
      if (!partner.name || partner.name.trim().length < 2) {
        errors[`partner_${index}_name`] = `Partner ${index + 1} name is required`;
      }
      if (!partner.country || partner.country.trim().length < 2) {
        errors[`partner_${index}_country`] = `Partner ${index + 1} country is required`;
      }
    });
  }

  // EU Priorities validation
  if (!formData.selected_priorities || formData.selected_priorities.length === 0) {
    errors.selected_priorities = 'Please select at least one EU priority';
  }
  if (formData.selected_priorities && formData.selected_priorities.length > 4) {
    errors.selected_priorities = 'Please select no more than 4 priorities for focused project';
  }

  // Target groups validation
  if (!formData.target_groups || (Array.isArray(formData.target_groups) && formData.target_groups.length === 0)) {
    errors.target_groups = 'Please specify target groups for your project';
  }

  // Duration validation
  if (!formData.duration_months || formData.duration_months < 6 || formData.duration_months > 36) {
    errors.duration_months = 'Project duration must be between 6 and 36 months';
  }

  // Budget validation
  if (!formData.budget_eur || formData.budget_eur < 0) {
    errors.budget_eur = 'Budget must be a positive number';
  }
  if (formData.budget_eur && formData.budget_eur > 1000000) {
    errors.budget_eur = 'Budget seems unusually high. Please verify (max €1,000,000 for KA220)';
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
