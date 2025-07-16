// Dynamic API client for Netlify Functions
class DynamicAPI {
  constructor() {
    this.baseURL = '/.netlify/functions';
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
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
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  }

  // Admissions
  async submitApplication(applicationData) {
    return this.request('/admissions/apply', {
      method: 'POST',
      body: applicationData
    });
  }

  async getApplications() {
    return this.request('/admissions/applications');
  }

  async updateApplication(applicationId, action, reason = '') {
    return this.request(`/admissions/applications/${applicationId}`, {
      method: 'PUT',
      body: { action, reason }
    });
  }

  // Courses
  async getPracticeCourses() {
    return this.request('/courses/practice-courses');
  }

  async getCourse(courseId) {
    return this.request(`/courses/course/${courseId}`);
  }

  async updateProgress(progressData) {
    return this.request('/courses/progress', {
      method: 'POST',
      body: progressData
    });
  }

  async getMyProgress() {
    return this.request('/courses/my-progress');
  }

  // Admin
  async adminLogin(code) {
    return this.request('/admin/admin-login', {
      method: 'POST',
      body: { code }
    });
  }

  async getDashboardStats() {
    return this.request('/admin/dashboard-stats');
  }
}

// Global API instance
window.dynamicAPI = new DynamicAPI();

// Auto-login check
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('authToken');
  if (token) {
    window.dynamicAPI.setToken(token);
  }
});