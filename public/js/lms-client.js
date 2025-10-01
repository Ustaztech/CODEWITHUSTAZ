// LMS Client for frontend interactions
class LMSClient {
  constructor() {
    this.baseURL = '/.netlify/functions/lms-api';
    this.token = localStorage.getItem('lms_token');
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
}

// Global LMS client
window.lmsClient = new LMSClient();

// Auto-check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  if (window.lmsClient.isAuthenticated()) {
    console.log('User is authenticated');
  }
});