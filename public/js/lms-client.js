// LMS Client for frontend interactions
class LMSClient {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' ? 
      '/api' : '/.netlify/functions/lms-api';
    this.token = localStorage.getItem('lms_token');
    this.useFallback = false;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('lms_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('lms_token');
  }

  async request(endpoint, options = {}) {
    // Try backend first, fallback to local storage if it fails
    try {
      return await this.makeRequest(endpoint, options);
    } catch (error) {
      console.warn('Backend unavailable, using fallback mode:', error.message);
      this.useFallback = true;
      return this.handleFallback(endpoint, options);
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('LMS API Error:', error);
      throw error;
    }
  }

  async handleFallback(endpoint, options = {}) {
    if (!window.fallbackLMS) {
      throw new Error('Fallback system not available');
    }

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    if (endpoint === '/auth/login' && method === 'POST') {
      return window.fallbackLMS.login(body.email, body.password);
    }

    if (endpoint === '/auth/register' && method === 'POST') {
      return window.fallbackLMS.register(body);
    }

    if (endpoint === '/dashboard') {
      return window.fallbackLMS.getDashboard();
    }

    if (endpoint === '/courses') {
      return window.fallbackLMS.courses;
    }

    if (endpoint.startsWith('/course/')) {
      const courseId = endpoint.split('/')[2];
      return window.fallbackLMS.getCourse(courseId);
    }

    if (endpoint === '/progress' && method === 'POST') {
      return window.fallbackLMS.updateProgress(body);
    }

    throw new Error('Endpoint not supported in fallback mode');
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Courses
  async getCourses() {
    return this.request('/courses');
  }

  async getCourse(courseId) {
    return this.request(`/course/${courseId}`);
  }

  // Progress
  async updateProgress(progressData) {
    return this.request('/progress', {
      method: 'POST',
      body: progressData
    });
  }

  async getMyProgress() {
    return this.request('/my-progress');
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  isAuthenticated() {
    return !!this.token;
  }

  isFallbackMode() {
    return this.useFallback;
  }
}

// Global LMS client
window.lmsClient = new LMSClient();

// Auto-check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load fallback data script
  const fallbackScript = document.createElement('script');
  fallbackScript.src = '/js/fallback-data.js';
  document.head.appendChild(fallbackScript);
  
  if (window.lmsClient.isAuthenticated()) {
    console.log('User is authenticated');
  }
});