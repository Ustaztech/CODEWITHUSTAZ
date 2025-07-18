const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Course creation validation
const validateCourse = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Course title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('Course description must be between 20 and 500 characters'),
  
  body('category')
    .isIn(['web-development', 'programming', 'data-science', 'mobile-development', 'cybersecurity', 'design'])
    .withMessage('Please select a valid category'),
  
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Please select a valid level'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('estimatedDuration')
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be at least 1 hour'),
  
  handleValidationErrors
];

// Course review validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Admission application validation
const validateAdmission = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('course')
    .notEmpty()
    .withMessage('Please select a course'),
  
  body('motivation')
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Motivation must be between 50 and 1000 characters'),
  
  handleValidationErrors
];

// Progress update validation
const validateProgress = [
  body('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required'),
  
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number'),
  
  body('quizScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Quiz score must be between 0 and 100'),
  
  handleValidationErrors
];

// Note validation
const validateNote = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Note content must be between 1 and 2000 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateCourse,
  validateReview,
  validateAdmission,
  validateProgress,
  validateNote,
  handleValidationErrors
};