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
      if (err.loc && err.msg) {
        const field = err.loc[err.loc.length - 1];
        return `${field}: ${err.msg}`;
      }
      return err.msg || err;
    })
    .join(', ');
};