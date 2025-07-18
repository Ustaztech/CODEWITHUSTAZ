const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lesson_start', 'lesson_complete', 'quiz_attempt', 'quiz_complete', 'exercise_attempt', 'exercise_complete', 'video_watch', 'resource_download'],
    required: true
  },
  lessonId: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 1
  },
  data: {
    type: mongoose.Schema.Types.Mixed // Additional activity-specific data
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  moduleProgress: [{
    moduleId: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      lessonId: String,
      completedAt: Date,
      timeSpent: Number, // in minutes
      score: Number,
      attempts: Number
    }],
    startedAt: Date,
    completedAt: Date
  }],
  activities: [activitySchema],
  statistics: {
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    exercisesCompleted: {
      type: Number,
      default: 0
    },
    videosWatched: {
      type: Number,
      default: 0
    },
    resourcesDownloaded: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_lesson', 'first_quiz', 'perfect_score', 'speed_learner', 'consistent_learner', 'course_complete', 'module_complete']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  notes: [{
    lessonId: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lessonId: String,
    timestamp: Number, // for video bookmarks
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1 });
progressSchema.index({ course: 1 });
progressSchema.index({ 'activities.timestamp': -1 });

// Update last accessed time
progressSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  next();
});

// Add activity method
progressSchema.methods.addActivity = function(activityData) {
  this.activities.push(activityData);
  
  // Update statistics based on activity type
  switch (activityData.type) {
    case 'lesson_complete':
      this.statistics.lessonsCompleted += 1;
      this.statistics.totalTimeSpent += Math.round(activityData.duration / 60) || 0;
      break;
    case 'quiz_complete':
      this.statistics.quizzesCompleted += 1;
      if (activityData.score) {
        const totalScore = this.statistics.averageQuizScore * (this.statistics.quizzesCompleted - 1) + activityData.score;
        this.statistics.averageQuizScore = totalScore / this.statistics.quizzesCompleted;
      }
      break;
    case 'exercise_complete':
      this.statistics.exercisesCompleted += 1;
      break;
    case 'video_watch':
      this.statistics.videosWatched += 1;
      this.statistics.totalTimeSpent += Math.round(activityData.duration / 60) || 0;
      break;
    case 'resource_download':
      this.statistics.resourcesDownloaded += 1;
      break;
  }
  
  // Update streak
  this.updateStreak();
  
  return this.save();
};

// Update learning streak
progressSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if there was activity today
  const todayActivities = this.activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  // Check if there was activity yesterday
  const yesterdayActivities = this.activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === yesterday.getTime();
  });
  
  if (todayActivities.length > 0) {
    if (yesterdayActivities.length > 0 || this.statistics.currentStreak === 0) {
      this.statistics.currentStreak += 1;
      if (this.statistics.currentStreak > this.statistics.longestStreak) {
        this.statistics.longestStreak = this.statistics.currentStreak;
      }
    }
  } else {
    // Check if streak should be reset (no activity for more than 1 day)
    const lastActivity = this.activities.length > 0 ? 
      new Date(Math.max(...this.activities.map(a => new Date(a.timestamp)))) : 
      new Date(0);
    
    const daysSinceLastActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastActivity > 1) {
      this.statistics.currentStreak = 0;
    }
  }
};

// Complete lesson method
progressSchema.methods.completeLesson = function(moduleId, lessonId, timeSpent = 0, score = null) {
  // Find or create module progress
  let moduleProgress = this.moduleProgress.find(mp => mp.moduleId === moduleId);
  if (!moduleProgress) {
    moduleProgress = {
      moduleId,
      progress: 0,
      completedLessons: [],
      startedAt: new Date()
    };
    this.moduleProgress.push(moduleProgress);
  }
  
  // Check if lesson already completed
  const existingLesson = moduleProgress.completedLessons.find(cl => cl.lessonId === lessonId);
  if (!existingLesson) {
    moduleProgress.completedLessons.push({
      lessonId,
      completedAt: new Date(),
      timeSpent,
      score,
      attempts: 1
    });
  } else {
    // Update existing lesson
    existingLesson.timeSpent += timeSpent;
    existingLesson.attempts += 1;
    if (score !== null && (existingLesson.score === null || score > existingLesson.score)) {
      existingLesson.score = score;
    }
  }
  
  // Add activity
  this.addActivity({
    type: 'lesson_complete',
    lessonId,
    duration: timeSpent * 60, // convert to seconds
    score
  });
  
  // Check for achievements
  this.checkAchievements(moduleId, lessonId, score);
  
  return this.save();
};

// Check and award achievements
progressSchema.methods.checkAchievements = function(moduleId, lessonId, score) {
  const achievements = [];
  
  // First lesson achievement
  if (this.statistics.lessonsCompleted === 1) {
    achievements.push({
      type: 'first_lesson',
      earnedAt: new Date(),
      data: { lessonId }
    });
  }
  
  // Perfect score achievement
  if (score === 100) {
    achievements.push({
      type: 'perfect_score',
      earnedAt: new Date(),
      data: { lessonId, score }
    });
  }
  
  // Consistent learner (7-day streak)
  if (this.statistics.currentStreak === 7) {
    achievements.push({
      type: 'consistent_learner',
      earnedAt: new Date(),
      data: { streak: 7 }
    });
  }
  
  // Add achievements
  achievements.forEach(achievement => {
    const exists = this.achievements.some(a => 
      a.type === achievement.type && 
      JSON.stringify(a.data) === JSON.stringify(achievement.data)
    );
    if (!exists) {
      this.achievements.push(achievement);
    }
  });
};

// Calculate overall progress
progressSchema.methods.calculateProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  
  if (!course) return 0;
  
  const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const completedLessons = this.moduleProgress.reduce((total, mp) => total + mp.completedLessons.length, 0);
  
  this.overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Update module progress
  course.modules.forEach(module => {
    const moduleProgress = this.moduleProgress.find(mp => mp.moduleId === module.id);
    if (moduleProgress) {
      const moduleCompletedLessons = moduleProgress.completedLessons.length;
      const moduleTotalLessons = module.lessons.length;
      moduleProgress.progress = moduleTotalLessons > 0 ? 
        Math.round((moduleCompletedLessons / moduleTotalLessons) * 100) : 0;
      
      if (moduleProgress.progress === 100 && !moduleProgress.completedAt) {
        moduleProgress.completedAt = new Date();
        // Award module completion achievement
        this.achievements.push({
          type: 'module_complete',
          earnedAt: new Date(),
          data: { moduleId: module.id, moduleName: module.title }
        });
      }
    }
  });
  
  // Check course completion
  if (this.overallProgress === 100 && !this.completedAt) {
    this.completedAt = new Date();
    // Award course completion achievement
    this.achievements.push({
      type: 'course_complete',
      earnedAt: new Date(),
      data: { courseId: this.course, courseName: course.title }
    });
  }
  
  return this.save();
};

module.exports = mongoose.model('Progress', progressSchema);