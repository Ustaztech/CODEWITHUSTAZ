const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  matricNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
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
      score: Number
    }],
    certificates: [{
      certificateId: String,
      issuedAt: Date,
      certificateUrl: String
    }]
  }],
  learningStats: {
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    coursesCompleted: {
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
    },
    lastActivityDate: {
      type: Date,
      default: Date.now
    },
    achievements: [{
      type: String,
      achievedAt: Date
    }]
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    loginAt: Date,
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ matricNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'enrolledCourses.courseId': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update learning stats
userSchema.methods.updateLearningStats = function(lessonData) {
  this.learningStats.totalTimeSpent += lessonData.timeSpent || 0;
  this.learningStats.lessonsCompleted += 1;
  this.learningStats.lastActivityDate = new Date();
  
  // Update streak
  const today = new Date();
  const lastActivity = new Date(this.learningStats.lastActivityDate);
  const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    this.learningStats.currentStreak += 1;
    if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
      this.learningStats.longestStreak = this.learningStats.currentStreak;
    }
  } else if (daysDiff > 1) {
    this.learningStats.currentStreak = 1;
  }
  
  return this.save();
};

// Get user progress for a specific course
userSchema.methods.getCourseProgress = function(courseId) {
  const enrollment = this.enrolledCourses.find(
    course => course.courseId.toString() === courseId.toString()
  );
  return enrollment || null;
};

// Add achievement
userSchema.methods.addAchievement = function(achievement) {
  if (!this.learningStats.achievements.includes(achievement)) {
    this.learningStats.achievements.push({
      type: achievement,
      achievedAt: new Date()
    });
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);