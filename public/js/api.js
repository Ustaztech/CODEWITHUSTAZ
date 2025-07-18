// API client for the Learning Management System
class LMSApi {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('lms_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('lms_token', token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('lms_token');
  }

  // Make HTTP request
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
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
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

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword }
    });
  }

  // Course methods
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/courses${queryString ? '?' + queryString : ''}`);
  }

  async getPracticeCourses() {
    return this.request('/courses/practice');
  }

  async getCourse(slug) {
    return this.request(`/courses/${slug}`);
  }

  async enrollInCourse(courseId) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST'
    });
  }

  async getLesson(courseId, lessonId) {
    return this.request(`/courses/${courseId}/lessons/${lessonId}`);
  }

  async completeLesson(courseId, lessonId, data = {}) {
    return this.request(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: data
    });
  }

  async submitQuiz(courseId, lessonId, answer, timeSpent = 0) {
    return this.request(`/courses/${courseId}/lessons/${lessonId}/quiz`, {
      method: 'POST',
      body: { answer, timeSpent }
    });
  }

  async addCourseReview(courseId, rating, comment) {
    return this.request(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: { rating, comment }
    });
  }

  // Progress methods
  async getProgressOverview() {
    return this.request('/progress/overview');
  }

  async getCourseProgress(courseId) {
    return this.request(`/progress/course/${courseId}`);
  }

  async addNote(courseId, lessonId, content) {
    return this.request(`/progress/course/${courseId}/lesson/${lessonId}/note`, {
      method: 'POST',
      body: { content }
    });
  }

  async addBookmark(courseId, lessonId, timestamp = 0, note = '') {
    return this.request(`/progress/course/${courseId}/lesson/${lessonId}/bookmark`, {
      method: 'POST',
      body: { timestamp, note }
    });
  }

  async removeBookmark(bookmarkId) {
    return this.request(`/progress/bookmark/${bookmarkId}`, {
      method: 'DELETE'
    });
  }

  async getAnalytics(period = '30') {
    return this.request(`/progress/analytics?period=${period}`);
  }

  async getLeaderboard(period = 'all', limit = 10) {
    return this.request(`/progress/leaderboard?period=${period}&limit=${limit}`);
  }

  // Dashboard methods
  async getDashboard() {
    return this.request('/dashboard');
  }

  async getNotifications() {
    return this.request('/dashboard/notifications');
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/dashboard/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // Admission methods
  async submitAdmission(applicationData) {
    return this.request('/admissions/apply', {
      method: 'POST',
      body: applicationData
    });
  }

  // Admin methods (require admin role)
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getSystemHealth() {
    return this.request('/admin/system-health');
  }

  async getAdminAnalytics(period = '30') {
    return this.request(`/admin/analytics?period=${period}`);
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? '?' + queryString : ''}`);
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: userData
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getAdmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admissions/applications${queryString ? '?' + queryString : ''}`);
  }

  async processAdmission(applicationId, action, rejectionReason = '') {
    return this.request(`/admissions/applications/${applicationId}`, {
      method: 'PUT',
      body: { action, rejectionReason }
    });
  }

  async updatePaymentStatus(applicationId, paymentStatus) {
    return this.request(`/admissions/applications/${applicationId}/payment`, {
      method: 'PUT',
      body: { paymentStatus }
    });
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  async verifyToken() {
    try {
      await this.request('/auth/verify');
      return true;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }
}

// Create global API instance
window.lmsApi = new LMSApi();

// Auto-verify token on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lmsApi.isAuthenticated()) {
    const isValid = await window.lmsApi.verifyToken();
    if (!isValid && window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
      // Redirect to login if token is invalid and not already on auth pages
      window.location.href = '/login.html';
    }
  }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LMSApi;
}