import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extract error detail from responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail || 'An unexpected error occurred';
      const status = error.response.status;

      // Auto-logout on 401 (invalid/expired token)
      if (status === 401 && !error.config.url?.includes('/auth/')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      const enrichedError = new Error(detail);
      enrichedError.status = status;
      enrichedError.detail = detail;
      return Promise.reject(enrichedError);
    }

    // Network error
    const networkError = new Error('Network error — please check your connection');
    networkError.detail = 'Network error — please check your connection';
    return Promise.reject(networkError);
  }
);

export default client;
