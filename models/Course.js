const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Lesson description is required']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  videoUrl: {
    type: String
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'code', 'image']
    }
  }],
  quiz: {
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    points: {
      type: Number,
      default: 10
    }
  },
  practiceExercise: {
    title: String,
    description: String,
    starterCode: String,
    solution: String,
    hints: [String]
  }
});

const moduleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Module description is required']
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [500, 'Course description cannot exceed 500 characters']
  },
  longDescription: {
    type: String,
    maxlength: [2000, 'Long description cannot exceed 2000 characters']
  },
  thumbnail: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['web-development', 'programming', 'data-science', 'mobile-development', 'cybersecurity', 'design']
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course instructor is required']
  },
  modules: [moduleSchema],
  prerequisites: [String],
  learningOutcomes: [String],
  tags: [String],
  language: {
    type: String,
    default: 'English'
  },
  estimatedDuration: {
    type: Number, // in hours
    required: [true, 'Estimated duration is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  certificate: {
    template: String,
    requirements: {
      minProgress: {
        type: Number,
        default: 80
      },
      minQuizScore: {
        type: Number,
        default: 70
      }
    }
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ tags: 1 });

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((total, module) => total + module.lessons.length, 0);
});

// Virtual for total duration
courseSchema.virtual('totalDuration').get(function() {
  return this.modules.reduce((total, module) => {
    return total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.duration, 0);
  }, 0);
});

// Generate slug from title
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Update completion rate
courseSchema.methods.updateCompletionRate = async function() {
  const User = mongoose.model('User');
  const enrolledUsers = await User.find({
    'enrolledCourses.courseId': this._id
  });
  
  if (enrolledUsers.length === 0) {
    this.analytics.completionRate = 0;
    return this.save();
  }
  
  const completedUsers = enrolledUsers.filter(user => {
    const enrollment = user.enrolledCourses.find(
      course => course.courseId.toString() === this._id.toString()
    );
    return enrollment && enrollment.progress >= 100;
  });
  
  this.analytics.completionRate = (completedUsers.length / enrolledUsers.length) * 100;
  return this.save();
};

// Get course progress for a user
courseSchema.methods.getUserProgress = function(userId) {
  const User = mongoose.model('User');
  return User.findById(userId).then(user => {
    if (!user) return null;
    return user.getCourseProgress(this._id);
  });
};

// Add review
courseSchema.methods.addReview = function(userId, rating, comment) {
  // Remove existing review from same user
  this.reviews = this.reviews.filter(review => 
    review.user.toString() !== userId.toString()
  );
  
  // Add new review
  this.reviews.push({
    user: userId,
    rating,
    comment,
    createdAt: new Date()
  });
  
  // Update rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);