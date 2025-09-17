import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with auth interceptor
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000 // 3 minutes timeout for long-running requests (increased for AI generation)
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
  // Simple section-by-section generation
  generateSection: async (sectionName, projectData, previousAnswers = {}) => {
    try {
      const response = await axiosInstance.post('/form/simple/generate-section', {
        section_name: sectionName,
        project_data: projectData,
        previous_answers: previousAnswers,
        language: 'en'
      }, {
        timeout: 60000 // 60 seconds per section (increased for complex AI generation)
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getSectionsList: async () => {
    try {
      const response = await axiosInstance.get('/form/simple/sections');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Progressive generation endpoints
  startProgressiveGeneration: async (projectData) => {
    try {
      const response = await axiosInstance.post('/form/progressive/start-generation', {
        project: projectData,
        language: 'en'
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to start generation');
      throw error;
    }
  },

  getGenerationStatus: async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/form/progressive/generation-status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  generateProgressiveSection: async (sessionId, sectionName, retry = false) => {
    try {
      const response = await axiosInstance.post('/form/progressive/generate-section', {
        session_id: sessionId,
        section_name: sectionName,
        retry
      }, {
        timeout: 30000 // 30 seconds per section
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  cancelGeneration: async (sessionId) => {
    try {
      const response = await axiosInstance.post(`/form/progressive/cancel-generation/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  streamProgress: (sessionId, onMessage, onError) => {
    const token = localStorage.getItem('access_token');
    console.log('SSE Token:', token ? 'Present' : 'Missing');
    console.log('SSE URL:', `${API_BASE_URL}/form/progressive/stream-progress/${sessionId}`);

    const eventSource = new EventSource(
      `${API_BASE_URL}/form/progressive/stream-progress/${sessionId}?token=${token}`,
      {
        withCredentials: true
      }
    );

    eventSource.onopen = () => {
      console.log('SSE connection opened successfully');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Message received:', data);
        onMessage(data);
      } catch (error) {
        console.error('SSE Parse Error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      console.error('SSE ReadyState:', eventSource.readyState);
      // ReadyState: 0 = connecting, 1 = open, 2 = closed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed by server');
      }
      onError(error);
      eventSource.close();
    };

    return eventSource;
  },

  // Generate form answers (original method with fallback)
  generateAnswers: async (projectData) => {
    try {
      const response = await axiosInstance.post('/form/generate-answers', {
        project: projectData,
        generate_pdf: false,
        language: 'en'
      }, {
        timeout: 120000 // Explicit 2-minute timeout for generation
      });
      
      toast.success('Application generated successfully!');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. The form generation is taking longer than expected. Please try again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to generate application');
      }
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

  // Generate project description using AI
  generateProjectDescription: async (title, existingDescription = '') => {
    try {
      const response = await axiosInstance.post('/form/generate-description', {
        title,
        existing_description: existingDescription
      });
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

  // Single question generation
  generateSingleAnswer: async (data) => {
    try {
      const response = await axiosInstance.post('/form/single/generate-single-answer', data, {
        timeout: 60000 // 60 seconds for single question (AI generation can take time)
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate answer');
      throw error;
    }
  },

  // Get questions for a section
  getSectionQuestions: async (section) => {
    try {
      const response = await axiosInstance.get(`/form/single/questions/${section}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
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

  // Quality Score endpoints
  calculateQualityScore: async (proposalId) => {
    try {
      const response = await axiosInstance.post(`/quality-score/calculate/${proposalId}`);
      return response.data;
    } catch (error) {
      console.error('Quality Score Error:', error);
      toast.error('Failed to calculate quality score');
      throw error;
    }
  },

  previewQualityScore: async (answers, projectContext = {}) => {
    try {
      const response = await axiosInstance.post('/quality-score/preview', {
        answers,
        project_context: projectContext
      });
      return response.data;
    } catch (error) {
      console.error('Quality Score Preview Error:', error);
      throw error;
    }
  },

  getQualityScore: async (proposalId, recalculate = false) => {
    try {
      const response = await axiosInstance.get(`/quality-score/${proposalId}`, {
        params: { recalculate }
      });
      return response.data;
    } catch (error) {
      console.error('Get Quality Score Error:', error);
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

  getBudgetMetrics: async (months = 12) => {
    try {
      const response = await axiosInstance.get(`/dashboard/budget-metrics?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('Budget Metrics Error:', error);
      throw error;
    }
  },

  getPriorityMetrics: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/priority-metrics');
      return response.data;
    } catch (error) {
      console.error('Priority Metrics Error:', error);
      throw error;
    }
  },

  getPerformanceMetrics: async (months = 6) => {
    try {
      const response = await axiosInstance.get(`/dashboard/performance-metrics?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('Performance Metrics Error:', error);
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
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Don't silently fail - let the component handle the error
      throw error;
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

  getProposalPDF: async (proposalId) => {
    try {
      const response = await axiosInstance.get(`/proposals/${proposalId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to generate PDF');
      throw error;
    }
  },

  // Payment and Subscription Methods
  getPricingPlans: async () => {
    try {
      const response = await axiosInstance.get('/payments/pricing-plans');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to fetch pricing plans');
      throw error;
    }
  },

  getSubscriptionStatus: async () => {
    try {
      const response = await axiosInstance.get('/payments/subscription-status');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      // Don't show error toast for subscription status as it might be expected
      throw error;
    }
  },

  createPaymentOrder: async (planType, returnUrl, cancelUrl) => {
    try {
      const response = await axiosInstance.post('/payments/create-order', {
        plan_type: planType,
        return_url: returnUrl,
        cancel_url: cancelUrl
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to create payment order');
      throw error;
    }
  },

  capturePaymentOrder: async (orderId) => {
    try {
      const response = await axiosInstance.post('/payments/capture-order', {
        order_id: orderId
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to process payment');
      throw error;
    }
  },

  checkSubscription: async () => {
    try {
      const response = await axiosInstance.post('/payments/check-subscription');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.response?.status === 403) {
        toast.error(error.response.data.detail || 'Subscription required');
      }
      throw error;
    }
  },

  getPaymentHistory: async () => {
    try {
      const response = await axiosInstance.get('/payments/payment-history');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to fetch payment history');
      throw error;
    }
  },

  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete
};

export default api;