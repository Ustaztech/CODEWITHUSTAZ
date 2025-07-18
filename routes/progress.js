const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get user's overall progress
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all user's progress records
    const progressRecords = await Progress.find({ user: userId })
      .populate('course', 'title thumbnail category level estimatedDuration')
      .sort({ lastAccessedAt: -1 });
    
    // Get user learning stats
    const user = await User.findById(userId).select('learningStats');
    
    // Calculate overall statistics
    const totalCourses = progressRecords.length;
    const completedCourses = progressRecords.filter(p => p.overallProgress === 100).length;
    const inProgressCourses = progressRecords.filter(p => p.overallProgress > 0 && p.overallProgress < 100).length;
    const totalTimeSpent = progressRecords.reduce((total, p) => total + p.statistics.totalTimeSpent, 0);
    const totalLessonsCompleted = progressRecords.reduce((total, p) => total + p.statistics.lessonsCompleted, 0);
    const averageProgress = totalCourses > 0 ? 
      progressRecords.reduce((total, p) => total + p.overallProgress, 0) / totalCourses : 0;
    
    // Get recent activities (last 10)
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
    
    // Get achievements
    const allAchievements = [];
    progressRecords.forEach(progress => {
      progress.achievements.forEach(achievement => {
        allAchievements.push({
          ...achievement.toObject(),
          courseName: progress.course.title,
          courseId: progress.course._id
        });
      });
    });
    
    allAchievements.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
    
    res.json({
      overview: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalTimeSpent,
        totalLessonsCompleted,
        averageProgress: Math.round(averageProgress),
        currentStreak: user.learningStats.currentStreak,
        longestStreak: user.learningStats.longestStreak
      },
      courses: progressRecords,
      recentActivities: recentActivities.slice(0, 10),
      achievements: allAchievements.slice(0, 20),
      learningStats: user.learningStats
    });
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    res.status(500).json({ error: 'Failed to fetch progress overview' });
  }
});

// Get progress for a specific course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: req.params.courseId
    }).populate('course', 'title modules');
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    // Calculate detailed progress for each module
    const detailedProgress = progress.course.modules.map(module => {
      const moduleProgress = progress.moduleProgress.find(mp => mp.moduleId === module.id) || {
        moduleId: module.id,
        progress: 0,
        completedLessons: []
      };
      
      const lessonProgress = module.lessons.map(lesson => {
        const completedLesson = moduleProgress.completedLessons.find(cl => cl.lessonId === lesson.id);
        return {
          lessonId: lesson.id,
          title: lesson.title,
          isCompleted: !!completedLesson,
          completedAt: completedLesson?.completedAt,
          timeSpent: completedLesson?.timeSpent || 0,
          score: completedLesson?.score,
          attempts: completedLesson?.attempts || 0
        };
      });
      
      return {
        moduleId: module.id,
        title: module.title,
        progress: moduleProgress.progress,
        completedLessons: moduleProgress.completedLessons.length,
        totalLessons: module.lessons.length,
        lessons: lessonProgress,
        startedAt: moduleProgress.startedAt,
        completedAt: moduleProgress.completedAt
      };
    });
    
    res.json({
      progress: {
        overallProgress: progress.overallProgress,
        enrolledAt: progress.enrolledAt,
        lastAccessedAt: progress.lastAccessedAt,
        completedAt: progress.completedAt,
        statistics: progress.statistics
      },
      modules: detailedProgress,
      achievements: progress.achievements,
      notes: progress.notes,
      bookmarks: progress.bookmarks
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

// Add or update note for a lesson
router.post('/course/:courseId/lesson/:lessonId/note', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const { courseId, lessonId } = req.params;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    // Find existing note or create new one
    const existingNoteIndex = progress.notes.findIndex(note => note.lessonId === lessonId);
    
    if (existingNoteIndex >= 0) {
      // Update existing note
      progress.notes[existingNoteIndex].content = content.trim();
      progress.notes[existingNoteIndex].updatedAt = new Date();
    } else {
      // Create new note
      progress.notes.push({
        lessonId,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await progress.save();
    
    res.json({ message: 'Note saved successfully' });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Add bookmark for a lesson
router.post('/course/:courseId/lesson/:lessonId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { timestamp = 0, note = '' } = req.body;
    const { courseId, lessonId } = req.params;
    
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    // Add bookmark
    progress.bookmarks.push({
      lessonId,
      timestamp,
      note: note.trim(),
      createdAt: new Date()
    });
    
    await progress.save();
    
    res.json({ message: 'Bookmark added successfully' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// Remove bookmark
router.delete('/bookmark/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,
      'bookmarks._id': req.params.bookmarkId
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    progress.bookmarks.id(req.params.bookmarkId).remove();
    await progress.save();
    
    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// Get learning analytics for a user
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const userId = req.user.userId;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const progressRecords = await Progress.find({ user: userId });
    
    // Daily activity data
    const dailyActivity = {};
    const categories = {};
    const weeklyProgress = {};
    
    progressRecords.forEach(progress => {
      // Filter activities by date range
      const recentActivities = progress.activities.filter(
        activity => new Date(activity.timestamp) >= startDate
      );
      
      recentActivities.forEach(activity => {
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        
        if (!dailyActivity[date]) {
          dailyActivity[date] = {
            lessons: 0,
            quizzes: 0,
            timeSpent: 0,
            activities: 0
          };
        }
        
        dailyActivity[date].activities += 1;
        
        if (activity.type === 'lesson_complete') {
          dailyActivity[date].lessons += 1;
          dailyActivity[date].timeSpent += Math.round(activity.duration / 60) || 0;
        } else if (activity.type === 'quiz_complete') {
          dailyActivity[date].quizzes += 1;
        }
      });
    });
    
    // Get course categories progress
    const coursesWithProgress = await Progress.find({ user: userId })
      .populate('course', 'category title');
    
    coursesWithProgress.forEach(progress => {
      const category = progress.course.category;
      if (!categories[category]) {
        categories[category] = {
          courses: 0,
          totalProgress: 0,
          timeSpent: 0
        };
      }
      
      categories[category].courses += 1;
      categories[category].totalProgress += progress.overallProgress;
      categories[category].timeSpent += progress.statistics.totalTimeSpent;
    });
    
    // Calculate average progress per category
    Object.keys(categories).forEach(category => {
      categories[category].averageProgress = 
        categories[category].totalProgress / categories[category].courses;
    });
    
    res.json({
      dailyActivity,
      categories,
      summary: {
        totalDays: parseInt(period),
        activeDays: Object.keys(dailyActivity).length,
        totalTimeSpent: Object.values(dailyActivity).reduce((sum, day) => sum + day.timeSpent, 0),
        totalLessons: Object.values(dailyActivity).reduce((sum, day) => sum + day.lessons, 0),
        totalQuizzes: Object.values(dailyActivity).reduce((sum, day) => sum + day.quizzes, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;
    
    let matchStage = {};
    if (period !== 'all') {
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      matchStage = { lastAccessedAt: { $gte: startDate } };
    }
    
    const leaderboard = await Progress.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$user',
          totalProgress: { $avg: '$overallProgress' },
          coursesCompleted: { $sum: { $cond: [{ $eq: ['$overallProgress', 100] }, 1, 0] } },
          totalTimeSpent: { $sum: '$statistics.totalTimeSpent' },
          totalLessons: { $sum: '$statistics.lessonsCompleted' },
          currentStreak: { $max: '$statistics.currentStreak' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          avatar: '$user.avatar',
          totalProgress: { $round: ['$totalProgress', 1] },
          coursesCompleted: 1,
          totalTimeSpent: 1,
          totalLessons: 1,
          currentStreak: 1,
          score: {
            $add: [
              { $multiply: ['$totalProgress', 0.4] },
              { $multiply: ['$coursesCompleted', 20] },
              { $multiply: ['$totalLessons', 2] },
              { $multiply: ['$currentStreak', 5] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;