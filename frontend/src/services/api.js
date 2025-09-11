import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with auth interceptor
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  // Generate form answers
  generateAnswers: async (projectData) => {
    try {
      const response = await axiosInstance.post('/form/generate-answers', {
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
      const response = await axiosInstance.get('/form/priorities');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Get form questions structure
  getFormQuestions: async () => {
    try {
      const response = await axiosInstance.get('/form/questions');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Validate answers
  validateAnswers: async (answers) => {
    try {
      const response = await axiosInstance.post('/form/validate', answers);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Export to PDF
  exportToPDF: async (applicationId) => {
    try {
      const response = await axiosInstance.get(
        `/form/pdf/${applicationId}`,
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
      const response = await axiosInstance.get('/health/ready');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Authentication endpoints
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  },

  // Dashboard endpoints
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Dashboard Error:', error);
      throw error;
    }
  },

  // Proposal endpoints
  createProposal: async (proposalData) => {
    try {
      const response = await axiosInstance.post('/proposals/', proposalData);
      toast.success('Proposal saved successfully!');
      return response.data;
    } catch (error) {
      console.error('Proposal Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to save proposal';
      toast.error(errorMessage);
      throw error;
    }
  },

  getProposals: async (skip = 0, limit = 10) => {
    try {
      const response = await axiosInstance.get('/proposals/', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Proposals Error:', error);
      // Return empty array if no proposals
      return [];
    }
  },
  
  getUserProposals: async (skip = 0, limit = 10) => {
    try {
      const response = await axiosInstance.get('/proposals/', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Proposals Error:', error);
      throw error;
    }
  },

  getProposal: async (proposalId) => {
    try {
      const response = await axiosInstance.get(`/proposals/${proposalId}`);
      return response.data;
    } catch (error) {
      console.error('Proposal Error:', error);
      throw error;
    }
  },

  updateProposal: async (proposalId, proposalData) => {
    try {
      const response = await axiosInstance.put(`/proposals/${proposalId}`, proposalData);
      toast.success('Proposal updated successfully!');
      return response.data;
    } catch (error) {
      console.error('Proposal Error:', error);
      toast.error('Failed to update proposal');
      throw error;
    }
  },

  deleteProposal: async (proposalId) => {
    try {
      const response = await axiosInstance.delete(`/proposals/${proposalId}`);
      toast.success('Proposal deleted successfully!');
      return response.data;
    } catch (error) {
      console.error('Proposal Error:', error);
      toast.error('Failed to delete proposal');
      throw error;
    }
  },

  submitProposal: async (proposalId) => {
    try {
      const response = await axiosInstance.post(`/proposals/${proposalId}/submit`);
      toast.success('Proposal submitted successfully!');
      return response.data;
    } catch (error) {
      console.error('Proposal Error:', error);
      toast.error('Failed to submit proposal');
      throw error;
    }
  },

  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete
};

export default api;