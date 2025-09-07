import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = {
  // Generate form answers
  generateAnswers: async (projectData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/form/generate-answers`, {
        project: projectData,
        generate_pdf: false,
        language: 'en'
      });
      
      toast.success('Application generated successfully!');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate application');
      throw error;
    }
  },

  // Get available priorities
  getPriorities: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/form/priorities`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Get form questions structure
  getFormQuestions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/form/questions`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Validate answers
  validateAnswers: async (answers) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/form/validate`, answers);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Export to PDF
  exportToPDF: async (applicationId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/form/pdf/${applicationId}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `erasmus-application-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to export PDF');
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health/ready`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default api;