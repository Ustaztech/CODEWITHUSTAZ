const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin dashboard statistics
router.get('/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'instructor', isActive: true }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Progress.countDocuments()
    ]);
    
    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      newUsersThisMonth,
      newEnrollmentsThisMonth,
      activeUsersThisMonth
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        isActive: true
      }),
      Progress.countDocuments({
        enrolledAt: { $gte: thirtyDaysAgo }
      }),
      User.countDocuments({
        'learningStats.lastActivityDate': { $gte: thirtyDaysAgo }
      })
    ]);
    
    // Get course completion rates
    const courseStats = await Course.aggregate([
      { $match: { isPublished: true } },
      {
        $lookup: {
          from: 'progresses',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          enrollmentCount: { $size: '$enrollments' },
          completedCount: {
            $size: {
              $filter: {
                input: '$enrollments',
                cond: { $eq: ['$$this.overallProgress', 100] }
              }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          enrollmentCount: 1,
          completedCount: 1,
          completionRate: {
            $cond: [
              { $eq: ['$enrollmentCount', 0] },
              0,
              { $multiply: [{ $divide: ['$completedCount', '$enrollmentCount'] }, 100] }
            ]
          }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Get recent user registrations
    const recentUsers = await User.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .select('firstName lastName email role createdAt')
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Get learning activity trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activityTrends = await Progress.aggregate([
      {
        $match: {
          'activities.timestamp': { $gte: sevenDaysAgo }
        }
      },
      { $unwind: '$activities' },
      {
        $match: {
          'activities.timestamp': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$activities.timestamp'
              }
            }
          },
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          totalActivities: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // Get top performing students
    const topStudents = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          totalTimeSpent: '$learningStats.totalTimeSpent',
          lessonsCompleted: '$learningStats.lessonsCompleted',
          currentStreak: '$learningStats.currentStreak',
          score: {
            $add: [
              { $multiply: ['$learningStats.lessonsCompleted', 10] },
              { $multiply: ['$learningStats.currentStreak', 5] },
              '$learningStats.totalTimeSpent'
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        newUsersThisMonth,
        newEnrollmentsThisMonth,
        activeUsersThisMonth
      },
      courseStats,
      recentUsers,
      activityTrends,
      topStudents
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get system health and performance metrics
router.get('/system-health', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const dbStats = await Promise.all([
      User.collection.stats(),
      Course.collection.stats(),
      Progress.collection.stats()
    ]);
    
    const systemHealth = {
      database: {
        status: 'healthy',
        collections: {
          users: {
            count: dbStats[0].count,
            size: dbStats[0].size,
            avgObjSize: dbStats[0].avgObjSize
          },
          courses: {
            count: dbStats[1].count,
            size: dbStats[1].size,
            avgObjSize: dbStats[1].avgObjSize
          },
          progress: {
            count: dbStats[2].count,
            size: dbStats[2].size,
            avgObjSize: dbStats[2].avgObjSize
          }
        }
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date()
    };
    
    res.json(systemHealth);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// Get detailed analytics
router.get('/analytics', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // User growth analytics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Course enrollment analytics
    const enrollmentAnalytics = await Progress.aggregate([
      {
        $match: {
          enrolledAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $group: {
          _id: {
            category: '$courseInfo.category',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$enrolledAt'
              }
            }
          },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Learning activity analytics
    const activityAnalytics = await Progress.aggregate([
      { $unwind: '$activities' },
      {
        $match: {
          'activities.timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$activities.type',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$activities.timestamp'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Revenue analytics (if applicable)
    const revenueAnalytics = await Course.aggregate([
      {
        $match: {
          price: { $gt: 0 },
          isPublished: true
        }
      },
      {
        $lookup: {
          from: 'progresses',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          price: 1,
          enrollmentCount: { $size: '$enrollments' },
          potentialRevenue: {
            $multiply: ['$price', { $size: '$enrollments' }]
          }
        }
      },
      { $sort: { potentialRevenue: -1 } }
    ]);
    
    res.json({
      userGrowth,
      enrollmentAnalytics,
      activityAnalytics,
      revenueAnalytics,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export data (CSV format)
router.get('/export/:type', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'users':
        data = await User.find({ isActive: true })
          .select('firstName lastName email role createdAt learningStats.totalTimeSpent learningStats.lessonsCompleted')
          .lean();
        filename = 'users_export.csv';
        break;
        
      case 'courses':
        data = await Course.find()
          .populate('instructor', 'firstName lastName')
          .select('title category level price enrollmentCount rating.average isPublished createdAt')
          .lean();
        filename = 'courses_export.csv';
        break;
        
      case 'progress':
        data = await Progress.find()
          .populate('user', 'firstName lastName email')
          .populate('course', 'title category')
          .select('user course overallProgress enrolledAt completedAt statistics.totalTimeSpent statistics.lessonsCompleted')
          .lean();
        filename = 'progress_export.csv';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    // Convert to CSV format
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found for export' });
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;