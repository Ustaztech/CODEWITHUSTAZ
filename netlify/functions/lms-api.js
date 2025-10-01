const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('codewithustaz-lms');
  cachedDb = db;
  return db;
}

// Sample courses data
const sampleCourses = [
  {
    id: 'html-fundamentals',
    title: 'HTML Fundamentals',
    description: 'Learn the basics of HTML structure and elements',
    category: 'web-development',
    level: 'beginner',
    price: 0,
    isFree: true,
    estimatedDuration: 8,
    modules: [
      {
        id: 'module-1',
        title: 'Getting Started with HTML',
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'What is HTML?',
            content: `
              <h3>What is HTML?</h3>
              <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
              
              <h4>Basic HTML Structure:</h4>
              <pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;My First Web Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Welcome to HTML!&lt;/h1&gt;
    &lt;p&gt;This is my first HTML document.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
              
              <h4>Key Points:</h4>
              <ul>
                <li>HTML uses tags to structure content</li>
                <li>Tags are enclosed in angle brackets</li>
                <li>Most tags have opening and closing versions</li>
                <li>The DOCTYPE declaration defines the document type</li>
              </ul>
            `,
            duration: 15,
            quiz: {
              question: 'What does HTML stand for?',
              options: [
                'HyperText Markup Language',
                'High Tech Modern Language',
                'Home Tool Markup Language',
                'Hyperlink and Text Markup Language'
              ],
              correctAnswer: 0,
              explanation: 'HTML stands for HyperText Markup Language.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'css-basics',
    title: 'CSS Styling Basics',
    description: 'Learn how to style HTML elements with CSS',
    category: 'web-development',
    level: 'beginner',
    price: 0,
    isFree: true,
    estimatedDuration: 10,
    modules: [
      {
        id: 'module-1',
        title: 'CSS Fundamentals',
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Introduction to CSS',
            content: `
              <h3>What is CSS?</h3>
              <p>CSS (Cascading Style Sheets) is used to style and layout web pages.</p>
              
              <h4>CSS Syntax:</h4>
              <pre><code>selector {
    property: value;
    property: value;
}</code></pre>
              
              <h4>Basic Selectors:</h4>
              <pre><code>/* Element selector */
p { color: blue; }

/* Class selector */
.my-class { font-size: 16px; }

/* ID selector */
#my-id { background: yellow; }</code></pre>
            `,
            duration: 18,
            quiz: {
              question: 'What does CSS stand for?',
              options: [
                'Cascading Style Sheets',
                'Computer Style Sheets',
                'Creative Style Sheets',
                'Colorful Style Sheets'
              ],
              correctAnswer: 0,
              explanation: 'CSS stands for Cascading Style Sheets.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    category: 'programming',
    level: 'beginner',
    price: 0,
    isFree: true,
    estimatedDuration: 12,
    modules: [
      {
        id: 'module-1',
        title: 'JavaScript Basics',
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'JavaScript Introduction',
            content: `
              <h3>What is JavaScript?</h3>
              <p>JavaScript is a programming language that makes web pages interactive.</p>
              
              <h4>Variables:</h4>
              <pre><code>let name = "John";
const age = 25;
var city = "Lagos";</code></pre>
              
              <h4>Functions:</h4>
              <pre><code>function greet(name) {
    return "Hello, " + name + "!";
}

console.log(greet("World"));</code></pre>
            `,
            duration: 22,
            quiz: {
              question: 'Which keyword is used to declare a constant in JavaScript?',
              options: ['var', 'let', 'const', 'constant'],
              correctAnswer: 2,
              explanation: 'The "const" keyword is used to declare constants in JavaScript.'
            }
          }
        ]
      }
    ]
  }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const db = await connectToDatabase();
    const { path } = event;
    const body = event.body ? JSON.parse(event.body) : {};

    // Authentication endpoints
    if (path.includes('/auth/login')) {
      const { email, password } = body;

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email and password required' })
        };
      }

      const user = await db.collection('users').findOne({ email });
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        })
      };
    }

    if (path.includes('/auth/register')) {
      const { firstName, lastName, email, password, phone, gender } = body;

      if (!firstName || !lastName || !email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'All fields required' })
        };
      }

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        gender,
        role: 'student',
        createdAt: new Date(),
        isActive: true,
        enrolledCourses: [],
        learningStats: {
          totalTimeSpent: 0,
          lessonsCompleted: 0,
          coursesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      };

      const result = await db.collection('users').insertOne(newUser);

      const token = jwt.sign(
        { userId: result.insertedId, email, role: 'student' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: result.insertedId,
            email,
            firstName,
            lastName,
            role: 'student'
          }
        })
      };
    }

    // Course endpoints
    if (path.includes('/courses') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sampleCourses)
      };
    }

    if (path.includes('/course/') && event.httpMethod === 'GET') {
      const courseId = path.split('/').pop();
      const course = sampleCourses.find(c => c.id === courseId);
      
      if (!course) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Course not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(course)
      };
    }

    // Progress tracking
    if (path.includes('/progress') && event.httpMethod === 'POST') {
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      const { courseId, lessonId, completed, timeSpent, quizScore } = body;

      const progressData = {
        userId: decoded.userId,
        courseId,
        lessonId,
        completed,
        timeSpent: timeSpent || 0,
        quizScore: quizScore || null,
        completedAt: new Date()
      };

      await db.collection('progress').updateOne(
        { userId: decoded.userId, courseId, lessonId },
        { $set: progressData },
        { upsert: true }
      );

      // Update user learning stats
      await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $inc: {
            'learningStats.totalTimeSpent': timeSpent || 0,
            'learningStats.lessonsCompleted': completed ? 1 : 0
          }
        }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Progress updated successfully' })
      };
    }

    // Get user progress
    if (path.includes('/my-progress') && event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      const progress = await db.collection('progress').find({ 
        userId: decoded.userId 
      }).toArray();

      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { learningStats: 1 } }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          progress,
          learningStats: user?.learningStats || {}
        })
      };
    }

    // Dashboard data
    if (path.includes('/dashboard') && event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      const progress = await db.collection('progress').find({ 
        userId: decoded.userId 
      }).toArray();

      const enrolledCourses = sampleCourses.map(course => {
        const courseProgress = progress.filter(p => p.courseId === course.id);
        const completedLessons = courseProgress.filter(p => p.completed).length;
        const totalLessons = course.modules.reduce((total, module) => 
          total + module.lessons.length, 0);
        
        return {
          ...course,
          progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          completedLessons,
          totalLessons
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user,
          courses: enrolledCourses,
          stats: {
            enrolledCourses: enrolledCourses.length,
            completedCourses: enrolledCourses.filter(c => c.progress === 100).length,
            totalTimeSpent: user?.learningStats?.totalTimeSpent || 0,
            currentStreak: user?.learningStats?.currentStreak || 0
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('LMS API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};