/**
 * Utility to extract error messages from various error formats
 */

export const extractErrorMessage = (error) => {
  // If error.response exists (axios error)
  if (error.response?.data) {
    const data = error.response.data;
    
    // FastAPI validation error format
    if (data.detail) {
      // If detail is a string, return it
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      // If detail is an array of validation errors
      if (Array.isArray(data.detail)) {
        // Extract the first error message
        const firstError = data.detail[0];
        if (firstError?.msg) {
          return firstError.msg;
        }
        if (typeof firstError === 'string') {
          return firstError;
        }
        // If firstError is an object but doesn't have msg field
        if (typeof firstError === 'object' && firstError !== null) {
          // Try to extract meaningful error message from validation error object
          if (firstError.type && firstError.loc) {
            const field = firstError.loc[firstError.loc.length - 1] || 'field';
            return `Validation error in ${field}: ${firstError.type}`;
          }
          // Fallback to JSON string representation if no msg field
          return 'Validation error occurred';
        }
      }
      
      // If detail is an object with a message
      if (typeof data.detail === 'object' && data.detail.msg) {
        return data.detail.msg;
      }
    }
    
    // Generic message field
    if (data.message) {
      return data.message;
    }
    
    // If data itself is a string
    if (typeof data === 'string') {
      return data;
    }
  }
  
  // If error has a message property
  if (error.message) {
    return error.message;
  }
  
  // If error itself is a string
  if (typeof error === 'string') {
    return error;
  }
  
  // Default message
  return 'An unexpected error occurred';
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) {
    return extractErrorMessage(errors);
  }
  
  return errors
    .map(err => {
      // Handle validation error objects
      if (typeof err === 'object' && err !== null) {
        if (err.loc && err.msg) {
          const field = err.loc[err.loc.length - 1];
          return `${field}: ${err.msg}`;
        }
        if (err.msg) {
          return err.msg;
        }
        if (err.type && err.loc) {
          const field = err.loc[err.loc.length - 1] || 'field';
          return `${field}: ${err.type}`;
        }
        // Fallback for unknown object structure
        return 'Validation error';
      }
      // Handle string errors
      if (typeof err === 'string') {
        return err;
      }
      // Default fallback
      return 'Unknown error';
    })
    .filter(msg => msg) // Remove any empty messages
    .join(', ');
};