const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { matricNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const users = await User.find(filter)
      .select('-password -loginHistory')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('enrolledCourses.courseId', 'title');
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only or own profile)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or accessing own profile
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('enrolledCourses.courseId', 'title thumbnail category level');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's progress data
    const progressRecords = await Progress.find({ user: userId })
      .populate('course', 'title category level')
      .select('course overallProgress statistics achievements');
    
    res.json({
      user,
      progress: progressRecords
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only or own profile)
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, dateOfBirth, address, role, isActive } = req.body;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update allowed fields
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (address !== undefined) user.address = address ? address.trim() : null;
    
    // Only admin can update role and active status
    if (req.user.role === 'admin') {
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.loginHistory;
    
    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();
    
    // Also delete related progress records
    await Progress.deleteMany({ user: userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const studentCount = await User.countDocuments({ role: 'student' });
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Most active users (by learning time)
    const activeUsers30Days = await User.aggregate([
      {
        $match: {
          'learningStats.lastActivityDate': { $gte: thirtyDaysAgo }
        }
      },
      {
        $sort: { 'learningStats.totalTimeSpent': -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          'learningStats.totalTimeSpent': 1,
          'learningStats.lessonsCompleted': 1,
          'learningStats.currentStreak': 1
        }
      }
    ]);
    
    res.json({
      totalUsers,
      activeUsers,
      usersByRole: {
        students: studentCount,
        instructors: instructorCount,
        admins: adminCount
      },
      recentRegistrations,
      activeUsers30Days
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Bulk actions (admin only)
router.post('/admin/bulk-action', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { action, userIds } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Action and user IDs are required' });
    }
    
    let updateData = {};
    let message = '';
    
    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Users deactivated successfully';
        break;
      case 'make-instructor':
        updateData = { role: 'instructor' };
        message = 'Users promoted to instructor successfully';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );
    
    res.json({
      message,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

module.exports = router;