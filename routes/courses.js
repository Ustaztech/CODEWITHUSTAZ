const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateCourse, validateReview } = require('../middleware/validation');

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 12 } = req.query;
    
    const filter = { isPublished: true };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName avatar')
      .select('-modules.lessons.content -modules.lessons.quiz.correctAnswer -modules.lessons.practiceExercise.solution')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Course.countDocuments(filter);
    
    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get beginner practice courses (free courses)
router.get('/practice', async (req, res) => {
  try {
    const courses = await Course.find({ 
      isPublished: true, 
      isFree: true,
      level: 'beginner'
    })
    .populate('instructor', 'firstName lastName')
    .select('-modules.lessons.quiz.correctAnswer -modules.lessons.practiceExercise.solution')
    .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching practice courses:', error);
    res.status(500).json({ error: 'Failed to fetch practice courses' });
  }
});

// Get course by slug
router.get('/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    })
    .populate('instructor', 'firstName lastName avatar bio')
    .populate('reviews.user', 'firstName lastName avatar');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Increment view count
    course.analytics.totalViews += 1;
    await course.save();
    
    // If user is authenticated, get their progress
    let userProgress = null;
    if (req.user) {
      userProgress = await Progress.findOne({
        user: req.user.userId,
        course: course._id
      });
    }
    
    // Hide sensitive content for non-enrolled users
    if (!userProgress && !course.isFree) {
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          if (!lesson.isPreview) {
            lesson.content = 'This content is available after enrollment.';
            lesson.quiz = undefined;
            lesson.practiceExercise = undefined;
          }
        });
      });
    }
    
    res.json({ course, userProgress });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Enroll in a course
router.post('/:courseId/enroll', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = user.enrolledCourses.find(
      enrollment => enrollment.courseId.toString() === course._id.toString()
    );
    
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // For paid courses, check payment status (implement payment verification here)
    if (!course.isFree && course.price > 0) {
      // TODO: Implement payment verification
      // For now, we'll allow free enrollment for demo purposes
    }
    
    // Enroll user
    user.enrolledCourses.push({
      courseId: course._id,
      enrolledAt: new Date(),
      progress: 0,
      completedLessons: []
    });
    
    await user.save();
    
    // Create progress record
    const progress = new Progress({
      user: user._id,
      course: course._id,
      enrolledAt: new Date()
    });
    
    await progress.save();
    
    // Update course enrollment count
    course.enrollmentCount += 1;
    await course.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    io.emit('course-enrollment', {
      userId: user._id,
      courseId: course._id,
      courseName: course.title,
      userName: user.fullName
    });
    
    res.json({ 
      message: 'Successfully enrolled in course',
      progress: progress
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// Get lesson content
router.get('/:courseId/lessons/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is enrolled or course is free
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });
    
    if (!progress && !course.isFree) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }
    
    // Find the lesson
    let lesson = null;
    let moduleId = null;
    
    for (const module of course.modules) {
      const foundLesson = module.lessons.find(l => l.id === lessonId);
      if (foundLesson) {
        lesson = foundLesson;
        moduleId = module.id;
        break;
      }
    }
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Track lesson start activity
    if (progress) {
      await progress.addActivity({
        type: 'lesson_start',
        lessonId: lessonId,
        timestamp: new Date()
      });
    }
    
    res.json({ 
      lesson, 
      moduleId,
      userProgress: progress ? progress.moduleProgress.find(mp => mp.moduleId === moduleId) : null
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Complete a lesson
router.post('/:courseId/lessons/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { timeSpent = 0, quizScore = null } = req.body;
    
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });
    
    if (!progress) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Find module ID for the lesson
    let moduleId = null;
    for (const module of course.modules) {
      if (module.lessons.some(l => l.id === lessonId)) {
        moduleId = module.id;
        break;
      }
    }
    
    if (!moduleId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Complete the lesson
    await progress.completeLesson(moduleId, lessonId, timeSpent, quizScore);
    await progress.calculateProgress();
    
    // Update user learning stats
    const user = await User.findById(req.user.userId);
    await user.updateLearningStats({ timeSpent });
    
    // Emit real-time progress update
    const io = req.app.get('io');
    io.to(`course-${courseId}`).emit('lesson-completed', {
      userId: req.user.userId,
      courseId,
      lessonId,
      progress: progress.overallProgress
    });
    
    res.json({ 
      message: 'Lesson completed successfully',
      progress: progress.overallProgress,
      achievements: progress.achievements.slice(-3) // Return latest achievements
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Submit quiz answer
router.post('/:courseId/lessons/:lessonId/quiz', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { answer, timeSpent = 0 } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Find the lesson and quiz
    let lesson = null;
    for (const module of course.modules) {
      const foundLesson = module.lessons.find(l => l.id === lessonId);
      if (foundLesson) {
        lesson = foundLesson;
        break;
      }
    }
    
    if (!lesson || !lesson.quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const isCorrect = answer === lesson.quiz.correctAnswer;
    const score = isCorrect ? 100 : 0;
    
    // Track quiz activity
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });
    
    if (progress) {
      await progress.addActivity({
        type: 'quiz_complete',
        lessonId: lessonId,
        duration: timeSpent,
        score: score,
        data: { answer, isCorrect }
      });
    }
    
    res.json({
      isCorrect,
      score,
      explanation: lesson.quiz.explanation,
      correctAnswer: lesson.quiz.correctAnswer
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Add course review
router.post('/:courseId/reviews', authenticateToken, validateReview, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is enrolled
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: req.params.courseId
    });
    
    if (!progress) {
      return res.status(403).json({ error: 'Must be enrolled to review course' });
    }
    
    await course.addReview(req.user.userId, rating, comment);
    
    res.json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get course categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isPublished: true });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get course statistics (admin only)
router.get('/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const totalEnrollments = await Course.aggregate([
      { $group: { _id: null, total: { $sum: '$enrollmentCount' } } }
    ]);
    
    const popularCourses = await Course.find({ isPublished: true })
      .sort({ enrollmentCount: -1 })
      .limit(5)
      .select('title enrollmentCount rating');
    
    res.json({
      totalCourses,
      publishedCourses,
      totalEnrollments: totalEnrollments[0]?.total || 0,
      popularCourses
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({ error: 'Failed to fetch course statistics' });
  }
});

module.exports = router;