import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object') {
        message = data.error || data.message || data.details || JSON.stringify(data);
      }
    } else if (error.request) {
      // Request was made but no response was received
      message = 'Server not reachable. Please check your connection.';
    } else {
      // Something happened in setting up the request
      message = error.message;
    }
    
    // Ensure we don't return "[object Object]"
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }
    
    return Promise.reject(new Error(message));
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: (userId) => api.get(`/auth/${userId}`),
  updateProfile: (userId, userData) => api.put(`/auth/${userId}`, userData)
};

// Document APIs
export const documentAPI = {
  createDocument: (docData) => api.post('/documents', docData),
  getAllDocuments: () => api.get('/documents'),
  getDocumentById: (id) => api.get(`/documents/${id}`),
  updateDocument: (id, docData) => api.put(`/documents/${id}`, docData),
  deleteDocument: (id) => api.delete(`/documents/${id}`)
};

// PDF APIs
export const pdfAPI = {
  generatePDF: (pdfData) => api.post('/pdf/generate', pdfData, { responseType: 'blob' }),
  textToPDF: (textData) => api.post('/pdf/text-to-pdf', textData, { responseType: 'blob' }),
  uploadPDF: (formData) =>
    api.post('/pdf/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const convertAPI = {
  convert: (payload) => api.post('/convert', payload, { responseType: 'blob' })
};

export const flipbookAPI = {
  generateFlipbook: (payload) => api.post('/flipbook/view', payload)
};

// Template APIs
export const templateAPI = {
  createTemplate: (templateData) => api.post('/templates', templateData),
  getAllTemplates: () => api.get('/templates'),
  getTemplateById: (id) => api.get(`/templates/${id}`),
  updateTemplate: (id, templateData) => api.put(`/templates/${id}`, templateData),
  deleteTemplate: (id) => api.delete(`/templates/${id}`)
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
