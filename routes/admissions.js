const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateAdmission } = require('../middleware/validation');

// Admission model (simple schema for demo)
const admissionSchema = {
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: String,
  course: String,
  education: String,
  experience: String,
  motivation: String,
  referral: String,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  paymentStatus: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  processedAt: Date,
  processedBy: String,
  matricNumber: String,
  password: String,
  rejectionReason: String
};

// For demo purposes, we'll store admissions in memory
// In production, you'd want a proper Admission model
let admissions = [];

// Submit admission application
router.post('/apply', validateAdmission, async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfBirth, gender, address,
      course, education, experience, motivation, referral
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Check if application already exists
    const existingApplication = admissions.find(app => app.email.toLowerCase() === email.toLowerCase());
    if (existingApplication) {
      return res.status(400).json({ error: 'Application already submitted for this email' });
    }
    
    const applicationId = 'APP' + Date.now().toString().slice(-6);
    
    const application = {
      id: applicationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      address: address ? address.trim() : '',
      course,
      education,
      experience,
      motivation: motivation.trim(),
      referral: referral || '',
      status: 'pending',
      paymentStatus: 'pending',
      submittedAt: new Date(),
      admissionFee: 1000 // ₦1,000 admission fee
    };
    
    admissions.push(application);
    
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId,
      paymentDetails: {
        amount: 1000,
        currency: 'NGN',
        bankDetails: {
          bankName: 'GT Bank',
          accountName: 'YAHAYA ZAID',
          accountNumber: '0725847459'
        },
        whatsappContact: '08168985912',
        instructions: 'After payment, send proof to WhatsApp: 08168985912 with your application ID: ' + applicationId
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get all applications (admin only)
router.get('/applications', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filteredApplications = admissions;
    
    if (status) {
      filteredApplications = admissions.filter(app => app.status === status);
    }
    
    // Sort by submission date (newest first)
    filteredApplications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
    
    res.json({
      applications: paginatedApplications,
      totalPages: Math.ceil(filteredApplications.length / limit),
      currentPage: parseInt(page),
      total: filteredApplications.length,
      summary: {
        pending: admissions.filter(app => app.status === 'pending').length,
        approved: admissions.filter(app => app.status === 'approved').length,
        rejected: admissions.filter(app => app.status === 'rejected').length
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/applications/:applicationId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const application = admissions.find(app => app.id === req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Approve/Reject application
router.put('/applications/:applicationId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const applicationIndex = admissions.findIndex(app => app.id === req.params.applicationId);
    
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = admissions[applicationIndex];
    
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application has already been processed' });
    }
    
    if (action === 'approve') {
      // Generate matric number and password
      const matricNumber = generateMatricNumber();
      const password = generatePassword();
      
      // Update application
      application.status = 'approved';
      application.matricNumber = matricNumber;
      application.password = password;
      application.processedAt = new Date();
      application.processedBy = req.user.userId;
      
      // Create user account
      const newUser = new User({
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        password, // Will be hashed by pre-save middleware
        phone: application.phone,
        gender: application.gender,
        dateOfBirth: application.dateOfBirth,
        address: application.address,
        role: 'student',
        matricNumber,
        isActive: true,
        isEmailVerified: true
      });
      
      await newUser.save();
      
      // In a real app, you'd send an email here
      console.log(`✅ User approved: ${application.email} - Matric: ${matricNumber} - Password: ${password}`);
      
      res.json({
        message: 'Application approved successfully',
        matricNumber,
        password,
        loginUrl: '/login'
      });
      
    } else if (action === 'reject') {
      application.status = 'rejected';
      application.rejectionReason = rejectionReason || 'Application does not meet requirements';
      application.processedAt = new Date();
      application.processedBy = req.user.userId;
      
      // In a real app, you'd send a rejection email here
      console.log(`❌ Application rejected: ${application.email} - Reason: ${application.rejectionReason}`);
      
      res.json({
        message: 'Application rejected',
        reason: application.rejectionReason
      });
      
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }
    
    // Update the application in the array
    admissions[applicationIndex] = application;
    
  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Failed to process application' });
  }
});

// Update payment status
router.put('/applications/:applicationId/payment', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const applicationIndex = admissions.findIndex(app => app.id === req.params.applicationId);
    
    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (!['pending', 'confirmed', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    
    admissions[applicationIndex].paymentStatus = paymentStatus;
    
    res.json({
      message: 'Payment status updated successfully',
      paymentStatus
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Helper functions
function generateMatricNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CWU/${year}/${random}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get admission statistics
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = {
      total: admissions.length,
      pending: admissions.filter(app => app.status === 'pending').length,
      approved: admissions.filter(app => app.status === 'approved').length,
      rejected: admissions.filter(app => app.status === 'rejected').length,
      paymentPending: admissions.filter(app => app.paymentStatus === 'pending').length,
      paymentConfirmed: admissions.filter(app => app.paymentStatus === 'confirmed').length
    };
    
    // Course preferences
    const courseStats = {};
    admissions.forEach(app => {
      courseStats[app.course] = (courseStats[app.course] || 0) + 1;
    });
    
    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentApplications = admissions.filter(app => 
      new Date(app.submittedAt) >= sevenDaysAgo
    ).length;
    
    res.json({
      ...stats,
      coursePreferences: courseStats,
      recentApplications
    });
  } catch (error) {
    console.error('Error fetching admission stats:', error);
    res.status(500).json({ error: 'Failed to fetch admission statistics' });
  }
});

module.exports = router;