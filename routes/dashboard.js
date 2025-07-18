const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard data for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user with populated data
    const user = await User.findById(userId)
      .select('-password')
      .populate('enrolledCourses.courseId', 'title thumbnail category level');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's progress records
    const progressRecords = await Progress.find({ user: userId })
      .populate('course', 'title thumbnail category level estimatedDuration instructor')
      .populate('course.instructor', 'firstName lastName')
      .sort({ lastAccessedAt: -1 });
    
    // Get recommended courses (not enrolled, same category as enrolled courses)
    const enrolledCategories = progressRecords.map(p => p.course.category);
    const recommendedCourses = await Course.find({
      isPublished: true,
      category: { $in: enrolledCategories },
      _id: { $nin: progressRecords.map(p => p.course._id) }
    })
    .populate('instructor', 'firstName lastName')
    .limit(6)
    .select('title thumbnail category level price rating enrollmentCount');
    
    // Get recent activities
    const recentActivities = [];
    progressRecords.forEach(progress => {
      progress.activities.slice(-5).forEach(activity => {
        recentActivities.push({
          ...activity.toObject(),
          courseName: progress.course.title,
          courseId: progress.course._id
        });
      });
    });
    
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Calculate dashboard statistics
    const stats = {
      enrolledCourses: progressRecords.length,
      completedCourses: progressRecords.filter(p => p.overallProgress === 100).length,
      inProgressCourses: progressRecords.filter(p => p.overallProgress > 0 && p.overallProgress < 100).length,
      totalTimeSpent: progressRecords.reduce((total, p) => total + p.statistics.totalTimeSpent, 0),
      totalLessonsCompleted: progressRecords.reduce((total, p) => total + p.statistics.lessonsCompleted, 0),
      currentStreak: user.learningStats.currentStreak,
      longestStreak: user.learningStats.longestStreak,
      averageProgress: progressRecords.length > 0 ? 
        Math.round(progressRecords.reduce((total, p) => total + p.overallProgress, 0) / progressRecords.length) : 0
    };
    
    // Get recent achievements
    const recentAchievements = [];
    progressRecords.forEach(progress => {
      progress.achievements.slice(-3).forEach(achievement => {
        recentAchievements.push({
          ...achievement.toObject(),
          courseName: progress.course.title,
          courseId: progress.course._id
        });
      });
    });
    
    recentAchievements.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
    
    // Get learning streak data (last 30 days)
    const streakData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let hasActivity = false;
      progressRecords.forEach(progress => {
        const dayActivities = progress.activities.filter(activity => {
          const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
          return activityDate === dateStr;
        });
        if (dayActivities.length > 0) {
          hasActivity = true;
        }
      });
      
      streakData.push({
        date: dateStr,
        hasActivity,
        day: date.getDate(),
        month: date.getMonth()
      });
    }
    
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        matricNumber: user.matricNumber,
        role: user.role,
        joinedAt: user.createdAt
      },
      stats,
      courses: progressRecords.map(progress => ({
        id: progress.course._id,
        title: progress.course.title,
        thumbnail: progress.course.thumbnail,
        category: progress.course.category,
        level: progress.course.level,
        instructor: progress.course.instructor,
        progress: progress.overallProgress,
        lastAccessedAt: progress.lastAccessedAt,
        enrolledAt: progress.enrolledAt,
        completedAt: progress.completedAt,
        timeSpent: progress.statistics.totalTimeSpent,
        lessonsCompleted: progress.statistics.lessonsCompleted,
        nextLesson: getNextLesson(progress)
      })),
      recommendedCourses,
      recentActivities: recentActivities.slice(0, 10),
      recentAchievements: recentAchievements.slice(0, 5),
      streakData,
      learningStats: user.learningStats
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Helper function to get next lesson for a course
function getNextLesson(progress) {
  if (!progress.course.modules) return null;
  
  for (const module of progress.course.modules) {
    const moduleProgress = progress.moduleProgress.find(mp => mp.moduleId === module.id);
    
    for (const lesson of module.lessons) {
      const isCompleted = moduleProgress?.completedLessons.some(cl => cl.lessonId === lesson.id);
      if (!isCompleted) {
        return {
          lessonId: lesson.id,
          title: lesson.title,
          moduleId: module.id,
          moduleTitle: module.title
        };
      }
    }
  }
  
  return null; // All lessons completed
}

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('enrolledCourses.courseId', 'title');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, address } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update allowed fields
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (address) user.address = address.trim();
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    // This is a placeholder for notifications system
    // In a real app, you'd have a Notification model
    const notifications = [
      {
        id: '1',
        type: 'achievement',
        title: 'New Achievement Unlocked!',
        message: 'You completed your first lesson',
        isRead: false,
        createdAt: new Date()
      },
      {
        id: '2',
        type: 'course',
        title: 'New Course Available',
        message: 'Check out our new Python course',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    ];
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    // Placeholder implementation
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;