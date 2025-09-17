/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Format a date string or Date object to a readable format
 * @param {string|Date} dateInput - The date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  return date.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format a date to show day and month in full format (e.g., "17 September 2025")
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateWithFullMonth = (dateInput) => {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a date for display in deadlines (e.g., "6 March 2025")
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date string
 */
export const formatDeadlineDate = (dateInput) => {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get current date formatted consistently
 * @returns {string} Current date in format "17 September 2025"
 */
export const getCurrentDateFormatted = () => {
  const now = new Date();
  return formatDateWithFullMonth(now);
};

/**
 * Format date and time together
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for Brussels time display
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date string with Brussels time
 */
export const formatBrusselsTime = (dateInput) => {
  if (!dateInput) return 'Not set';

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Europe/Brussels'
  });

  return `${timeString} (Brussels time)`;
};