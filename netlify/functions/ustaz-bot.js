const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('codewithustaz');
  cachedDb = db;
  return db;
}

// Advanced AI Knowledge Base
const knowledgeBase = {
  // Programming Languages
  javascript: {
    basics: {
      variables: "JavaScript variables can be declared using `var`, `let`, or `const`. Use `let` for block-scoped variables, `const` for constants, and avoid `var` in modern JavaScript.",
      functions: "Functions in JavaScript can be declared as function declarations, function expressions, or arrow functions. Arrow functions have lexical `this` binding.",
      promises: "Promises handle asynchronous operations. Use `.then()` and `.catch()` for handling, or `async/await` for cleaner syntax.",
      closures: "Closures allow inner functions to access outer function variables even after the outer function returns. They're fundamental to JavaScript's scope chain."
    },
    advanced: {
      prototypes: "JavaScript uses prototype-based inheritance. Every object has a prototype chain that determines property lookup.",
      eventLoop: "The event loop handles asynchronous operations through the call stack, callback queue, and microtask queue.",
      modules: "ES6 modules use `import` and `export` statements. CommonJS uses `require()` and `module.exports`.",
      performance: "Optimize JavaScript by minimizing DOM manipulation, using efficient algorithms, lazy loading, and proper memory management."
    }
  },
  python: {
    basics: {
      syntax: "Python uses indentation for code blocks. Variables don't need declaration. Use snake_case for naming.",
      dataTypes: "Python has dynamic typing with int, float, str, bool, list, dict, tuple, and set as main data types.",
      functions: "Functions are defined with `def`. They can have default parameters, *args, and **kwargs for flexible arguments.",
      loops: "Python has for loops (for item in iterable) and while loops. Use enumerate() for index-value pairs."
    },
    advanced: {
      decorators: "Decorators modify function behavior using @decorator syntax. They're functions that take functions as arguments.",
      generators: "Generators use `yield` to produce values lazily, saving memory for large datasets.",
      comprehensions: "List, dict, and set comprehensions provide concise ways to create collections: [x for x in range(10)]",
      asyncio: "Async/await in Python handles concurrent operations without blocking the main thread."
    }
  },
  webDevelopment: {
    frontend: {
      html: "HTML5 provides semantic elements like <header>, <nav>, <main>, <article>, <section>, <aside>, and <footer> for better structure.",
      css: "Modern CSS includes Flexbox for 1D layouts, Grid for 2D layouts, custom properties (variables), and responsive design principles.",
      react: "React uses components, props, state, and hooks. Key concepts: JSX, virtual DOM, lifecycle methods, and state management.",
      vue: "Vue.js features reactive data binding, component-based architecture, and a gentle learning curve with excellent documentation."
    },
    backend: {
      nodejs: "Node.js enables server-side JavaScript. Use Express.js for web servers, handle async operations properly, and implement proper error handling.",
      databases: "Choose SQL (PostgreSQL, MySQL) for structured data with relationships, NoSQL (MongoDB) for flexible schemas and scalability.",
      apis: "RESTful APIs use HTTP methods (GET, POST, PUT, DELETE) with proper status codes. GraphQL provides flexible data fetching.",
      security: "Implement authentication (JWT), authorization, input validation, HTTPS, CORS, and protect against common vulnerabilities."
    }
  },
  dataScience: {
    python: {
      pandas: "Pandas provides DataFrames for data manipulation. Key operations: read_csv(), groupby(), merge(), pivot_table().",
      numpy: "NumPy offers efficient array operations, mathematical functions, and is the foundation for other data science libraries.",
      matplotlib: "Matplotlib creates static visualizations. Use pyplot for MATLAB-like interface or object-oriented API for complex plots.",
      sklearn: "Scikit-learn provides machine learning algorithms: classification, regression, clustering, and model evaluation tools."
    },
    concepts: {
      statistics: "Understand descriptive statistics, probability distributions, hypothesis testing, and correlation vs causation.",
      machineLearning: "ML types: supervised (classification, regression), unsupervised (clustering, dimensionality reduction), reinforcement learning.",
      dataPreprocessing: "Clean data by handling missing values, outliers, normalization, encoding categorical variables, and feature selection.",
      visualization: "Effective visualizations tell stories. Choose appropriate chart types and follow design principles for clarity."
    }
  },
  cybersecurity: {
    fundamentals: {
      threats: "Common threats: malware, phishing, SQL injection, XSS, CSRF, man-in-the-middle attacks, and social engineering.",
      encryption: "Use AES for symmetric encryption, RSA for asymmetric. Implement proper key management and use HTTPS everywhere.",
      authentication: "Multi-factor authentication, strong password policies, and proper session management are essential.",
      networks: "Secure networks with firewalls, VPNs, network segmentation, and regular security audits."
    },
    practices: {
      coding: "Secure coding: validate inputs, use parameterized queries, implement proper error handling, and follow OWASP guidelines.",
      testing: "Perform penetration testing, vulnerability assessments, and code reviews regularly.",
      compliance: "Understand regulations like GDPR, HIPAA, PCI-DSS based on your industry and location.",
      incident: "Have incident response plans: detection, containment, eradication, recovery, and lessons learned."
    }
  },
  career: {
    paths: {
      frontend: "Frontend developers need HTML, CSS, JavaScript, frameworks (React/Vue/Angular), responsive design, and UX understanding.",
      backend: "Backend developers work with server languages, databases, APIs, cloud services, and system architecture.",
      fullstack: "Full-stack developers combine frontend and backend skills with understanding of the complete development lifecycle.",
      devops: "DevOps engineers focus on CI/CD, containerization, cloud platforms, monitoring, and infrastructure as code.",
      dataScience: "Data scientists need statistics, programming (Python/R), machine learning, data visualization, and domain expertise.",
      cybersecurity: "Security professionals need technical skills, risk assessment, compliance knowledge, and continuous learning."
    },
    skills: {
      technical: "Master your core technologies, understand algorithms and data structures, learn version control (Git), and practice problem-solving.",
      soft: "Develop communication skills, teamwork, problem-solving, adaptability, and continuous learning mindset.",
      portfolio: "Build projects that demonstrate your skills, contribute to open source, write technical blogs, and maintain a professional online presence.",
      networking: "Attend tech meetups, join online communities, find mentors, and build professional relationships."
    }
  },
  problemSolving: {
    debugging: {
      process: "1. Reproduce the bug consistently. 2. Isolate the problem area. 3. Form hypotheses. 4. Test systematically. 5. Fix and verify.",
      tools: "Use debuggers, logging, unit tests, and code reviews. Browser dev tools for frontend, IDE debuggers for backend.",
      common: "Common issues: typos, logic errors, scope problems, async issues, null/undefined values, and off-by-one errors."
    },
    algorithms: {
      complexity: "Big O notation describes algorithm efficiency. Common complexities: O(1), O(log n), O(n), O(n log n), O(n²).",
      dataStructures: "Choose appropriate structures: arrays for indexed access, linked lists for insertion/deletion, hash tables for lookups.",
      sorting: "Quick sort (average O(n log n)), merge sort (stable O(n log n)), heap sort (O(n log n) worst case).",
      searching: "Binary search (O(log n)) for sorted arrays, hash tables (O(1) average) for key-value lookups."
    }
  }
};

// Professional response templates
const responseTemplates = {
  explanation: (topic, content) => `
## 📚 ${topic}

${content}

### 💡 **Professional Recommendation:**
This is a fundamental concept that every developer should master. I recommend practicing with real examples and building projects to solidify your understanding.

### 🎯 **Next Steps:**
1. Practice with hands-on examples
2. Build a small project using this concept
3. Join our courses for structured learning
4. Ask follow-up questions for deeper understanding

**Need more specific guidance? I'm here to help you succeed!** 🚀
  `,
  
  solution: (problem, solution, explanation) => `
## 🔧 **Problem Solution**

**Issue:** ${problem}

### ✅ **Solution:**
\`\`\`
${solution}
\`\`\`

### 📖 **Explanation:**
${explanation}

### 🛡️ **Best Practices:**
- Always validate inputs
- Handle edge cases
- Write clean, readable code
- Test your solution thoroughly

### 🎓 **Learn More:**
Consider enrolling in our courses to master these concepts systematically!

**USTAZ DIGITALS is always here for you.** 💪
  `,
  
  career: (advice, steps) => `
## 🚀 **Career Guidance**

${advice}

### 📋 **Action Plan:**
${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

### 💼 **Industry Insights:**
The tech industry values continuous learning, practical skills, and problem-solving abilities. Focus on building real projects and contributing to the community.

### 🎯 **CODEWITHUSTAZ Can Help:**
Our courses are designed to make you job-ready with practical skills and industry-relevant projects.

**Your success is our mission!** 🌟
  `
};

// Advanced AI response generator
function generateIntelligentResponse(message, userContext = {}) {
  const msg = message.toLowerCase();
  
  // Extract key topics and intent
  const topics = extractTopics(msg);
  const intent = detectIntent(msg);
  const complexity = detectComplexity(msg);
  
  // Generate contextual response
  if (intent === 'explanation') {
    return generateExplanation(topics, complexity);
  } else if (intent === 'problem_solving') {
    return generateSolution(msg, topics);
  } else if (intent === 'career_advice') {
    return generateCareerAdvice(topics);
  } else if (intent === 'course_inquiry') {
    return generateCourseRecommendation(topics, userContext);
  } else {
    return generateGeneralResponse(msg, topics);
  }
}

function extractTopics(message) {
  const topics = [];
  const keywords = {
    javascript: ['javascript', 'js', 'react', 'node', 'express', 'promise', 'async', 'function'],
    python: ['python', 'django', 'flask', 'pandas', 'numpy', 'machine learning', 'data science'],
    web: ['html', 'css', 'frontend', 'backend', 'web development', 'responsive'],
    database: ['database', 'sql', 'mongodb', 'mysql', 'postgresql'],
    security: ['security', 'cybersecurity', 'encryption', 'authentication', 'vulnerability'],
    career: ['career', 'job', 'salary', 'interview', 'portfolio', 'skills']
  };
  
  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => message.includes(word))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

function detectIntent(message) {
  if (message.includes('how') || message.includes('what') || message.includes('explain')) {
    return 'explanation';
  } else if (message.includes('error') || message.includes('bug') || message.includes('fix') || message.includes('problem')) {
    return 'problem_solving';
  } else if (message.includes('career') || message.includes('job') || message.includes('salary')) {
    return 'career_advice';
  } else if (message.includes('course') || message.includes('learn') || message.includes('study')) {
    return 'course_inquiry';
  }
  return 'general';
}

function detectComplexity(message) {
  const advancedKeywords = ['advanced', 'complex', 'deep', 'architecture', 'optimization', 'performance'];
  const beginnerKeywords = ['basic', 'beginner', 'start', 'introduction', 'simple'];
  
  if (advancedKeywords.some(word => message.includes(word))) {
    return 'advanced';
  } else if (beginnerKeywords.some(word => message.includes(word))) {
    return 'beginner';
  }
  return 'intermediate';
}

function generateExplanation(topics, complexity) {
  if (topics.includes('javascript')) {
    const jsContent = complexity === 'advanced' ? 
      knowledgeBase.javascript.advanced : 
      knowledgeBase.javascript.basics;
    
    const topic = Object.keys(jsContent)[0];
    return responseTemplates.explanation(`JavaScript: ${topic}`, jsContent[topic]);
  }
  
  if (topics.includes('python')) {
    const pyContent = complexity === 'advanced' ? 
      knowledgeBase.python.advanced : 
      knowledgeBase.python.basics;
    
    const topic = Object.keys(pyContent)[0];
    return responseTemplates.explanation(`Python: ${topic}`, pyContent[topic]);
  }
  
  // Default comprehensive explanation
  return `
## 🤖 **USTAZ BOT Professional Analysis**

I understand you're looking for an explanation. Let me provide you with comprehensive guidance:

### 📚 **Core Concepts:**
Based on your question, here are the key areas to focus on:

1. **Fundamental Understanding** - Master the basics before advancing
2. **Practical Application** - Apply concepts through real projects
3. **Best Practices** - Follow industry standards and conventions
4. **Continuous Learning** - Stay updated with latest developments

### 💡 **Professional Recommendation:**
I recommend starting with our structured courses at CODEWITHUSTAZ where we provide:
- Step-by-step learning paths
- Hands-on projects
- Industry-relevant skills
- Professional mentorship

### 🎯 **Next Steps:**
1. Identify your specific learning goals
2. Choose the right course path
3. Practice consistently
4. Build a portfolio of projects

**Need more specific guidance? Please provide more details about what you'd like to learn!**

**USTAZ DIGITALS is always here for you.** 🚀
  `;
}

function generateSolution(message, topics) {
  // Common programming problems and solutions
  const solutions = {
    'async': {
      problem: 'Handling asynchronous operations',
      solution: `
// Using async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`,
      explanation: 'Async/await provides cleaner syntax for handling promises and makes asynchronous code more readable.'
    },
    'cors': {
      problem: 'CORS (Cross-Origin Resource Sharing) errors',
      solution: `
// Backend (Express.js)
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));

// Or for specific routes
app.get('/api/data', cors(), (req, res) => {
  res.json({ message: 'Data retrieved successfully' });
});`,
      explanation: 'CORS errors occur when frontend and backend are on different domains. Configure CORS middleware to allow specific origins.'
    }
  };
  
  // Find relevant solution
  for (const [key, solution] of Object.entries(solutions)) {
    if (message.includes(key)) {
      return responseTemplates.solution(solution.problem, solution.solution, solution.explanation);
    }
  }
  
  // Generic problem-solving response
  return `
## 🔧 **Problem-Solving Approach**

I'm here to help you solve any technical challenge! Here's my systematic approach:

### 🔍 **Diagnostic Process:**
1. **Understand the Problem** - What exactly is happening?
2. **Reproduce the Issue** - Can you consistently recreate it?
3. **Isolate Variables** - What changed recently?
4. **Research Solutions** - Check documentation and best practices
5. **Test Systematically** - Try solutions one at a time
6. **Verify the Fix** - Ensure the solution works completely

### 💡 **Common Solutions:**
- **Syntax Errors**: Check for typos, missing brackets, semicolons
- **Logic Errors**: Use console.log() or debugger to trace execution
- **API Issues**: Verify endpoints, check network tab, validate data
- **Performance**: Optimize algorithms, reduce DOM manipulation, use caching

### 🛠️ **Tools I Recommend:**
- Browser Developer Tools
- IDE debuggers
- Postman for API testing
- Git for version control

**Please share your specific error message or code snippet, and I'll provide a targeted solution!**

**USTAZ DIGITALS is always here for you.** 💪
  `;
}

function generateCareerAdvice(topics) {
  const careerPaths = knowledgeBase.career.paths;
  const skills = knowledgeBase.career.skills;
  
  if (topics.includes('frontend')) {
    return responseTemplates.career(
      "Frontend development is an exciting career path with high demand and creative opportunities.",
      [
        "Master HTML, CSS, and JavaScript fundamentals",
        "Learn a modern framework (React, Vue, or Angular)",
        "Understand responsive design and accessibility",
        "Build a portfolio with diverse projects",
        "Practice with real-world challenges",
        "Join our Frontend Development course for structured learning"
      ]
    );
  }
  
  // General career advice
  return `
## 🚀 **Professional Career Guidance**

### 💼 **Tech Career Landscape in Nigeria:**

**Entry Level (0-2 years):**
- Frontend Developer: ₦200k - ₦500k/month
- Backend Developer: ₦250k - ₦600k/month
- Full-Stack Developer: ₦300k - ₦700k/month
- Data Analyst: ₦180k - ₦450k/month

**Mid Level (2-5 years):**
- Senior Developer: ₦600k - ₦1.5M/month
- Tech Lead: ₦800k - ₦2M/month
- Product Manager: ₦700k - ₦1.8M/month

**Senior Level (5+ years):**
- Principal Engineer: ₦1.5M - ₦4M/month
- Engineering Manager: ₦2M - ₦5M/month
- CTO: ₦3M+/month

### 🎯 **Success Strategy:**
1. **Choose Your Path** - Frontend, Backend, Full-Stack, Data Science, or Cybersecurity
2. **Master Core Skills** - Deep knowledge beats surface-level understanding
3. **Build Real Projects** - Portfolio demonstrates practical abilities
4. **Network Actively** - Join tech communities and attend events
5. **Continuous Learning** - Technology evolves rapidly
6. **Contribute to Open Source** - Shows collaboration skills
7. **Develop Soft Skills** - Communication and teamwork are crucial

### 🏆 **CODEWITHUSTAZ Advantage:**
Our courses are designed to make you job-ready with:
- Industry-relevant curriculum
- Hands-on projects
- Professional mentorship
- Career guidance and support
- Job placement assistance

**Ready to start your tech career? Let's discuss which path aligns with your goals!**

**Your success is our mission!** 🌟
  `;
}

function generateCourseRecommendation(topics, userContext) {
  return `
## 🎓 **Personalized Course Recommendations**

Based on your interests, here are my professional recommendations:

### 🌟 **Our Premium Courses:**

#### 🌐 **Full-Stack Web Development** - ₦5,000
**Perfect if you want to build complete web applications**
- Frontend: HTML5, CSS3, JavaScript, React
- Backend: Node.js, Express, MongoDB
- Deployment: Heroku, Netlify
- Duration: 6 months with 10+ projects

#### 🐍 **Python & Data Science** - ₦5,000
**Ideal for data analysis and automation**
- Python fundamentals and advanced concepts
- Data analysis with Pandas and NumPy
- Machine Learning basics
- Duration: 4 months with 8+ projects

#### 📱 **Mobile App Development** - ₦5,000
**Create cross-platform mobile applications**
- Flutter and Dart programming
- Firebase integration
- App store deployment
- Duration: 5 months with 6+ apps

#### 🛡️ **Cybersecurity** - ₦5,000
**Protect systems and networks**
- Ethical hacking techniques
- Network security fundamentals
- Penetration testing
- Duration: 6 months with practical labs

### 🆓 **Free Practice Courses:**
Access our dashboard for beginner-friendly courses:
- HTML Fundamentals
- CSS Styling Basics
- JavaScript Fundamentals
- Python Basics
- Web Design Principles
- Programming Introduction

### 💳 **Payment Options:**
- **Bank Transfer**: GT Bank - YAHAYA ZAID - 0725847459
- **WhatsApp**: Send payment proof to 08168985912
- **Admission Fee**: ₦1,000 (one-time)

### 🎯 **Why Choose CODEWITHUSTAZ:**
✅ Industry-experienced instructors
✅ Hands-on project-based learning
✅ Job placement assistance
✅ Lifetime access to course materials
✅ Professional certificates
✅ Active community support

**Ready to transform your career? Contact us on WhatsApp: 08168985912**

**USTAZ DIGITALS is always here for you.** 🚀
  `;
}

function generateGeneralResponse(message, topics) {
  // Context-aware responses based on message content
  if (message.includes('hello') || message.includes('hi')) {
    return `
## 👋 **Hello! I'm USTAZ BOT - Your Professional AI Coding Assistant**

I'm an advanced AI assistant designed to help you excel in your programming journey. Here's what I can do for you:

### 🤖 **My Capabilities:**
- **Code Analysis & Debugging** - Find and fix errors in your code
- **Concept Explanations** - Break down complex programming concepts
- **Career Guidance** - Professional advice for tech careers
- **Project Assistance** - Help with planning and implementation
- **Best Practices** - Industry-standard coding practices
- **Technology Recommendations** - Choose the right tools and frameworks

### 💡 **How to Get the Best Help:**
1. **Be Specific** - Describe your exact problem or question
2. **Share Code** - Include relevant code snippets for debugging
3. **Provide Context** - Tell me your experience level and goals
4. **Ask Follow-ups** - Don't hesitate to ask for clarification

### 🎓 **Popular Topics I Excel At:**
- JavaScript, Python, HTML/CSS, React, Node.js
- Database design and optimization
- Web development best practices
- Career planning and skill development
- Project architecture and planning

**What would you like to learn or solve today?**

**USTAZ DIGITALS is always here for you.** 🚀
    `;
  }
  
  if (message.includes('thank')) {
    return `
## 🙏 **You're Very Welcome!**

I'm glad I could help you! Remember, learning programming is a journey, and I'm here to support you every step of the way.

### 🌟 **Keep Growing:**
- Practice consistently
- Build real projects
- Join our community
- Never stop learning

### 📚 **Continue Learning:**
Consider enrolling in our structured courses at CODEWITHUSTAZ for comprehensive skill development.

**Feel free to ask me anything else - I'm always ready to help!**

**USTAZ DIGITALS is always here for you.** 💪
    `;
  }
  
  // Default intelligent response
  return `
## 🤖 **USTAZ BOT Professional Response**

I understand you're looking for assistance. As your professional AI coding assistant, I'm equipped to help with:

### 🔧 **Technical Support:**
- Debugging code issues
- Explaining programming concepts
- Code optimization and best practices
- Architecture and design patterns

### 📚 **Learning Guidance:**
- Personalized learning paths
- Course recommendations
- Skill assessment and improvement
- Industry trends and technologies

### 💼 **Career Development:**
- Career path planning
- Skill gap analysis
- Portfolio development advice
- Interview preparation

### 🚀 **Project Assistance:**
- Project planning and structure
- Technology stack recommendations
- Implementation strategies
- Performance optimization

**To provide you with the most accurate and helpful response, please:**
1. Describe your specific question or challenge
2. Include any relevant code or error messages
3. Tell me your experience level
4. Specify what you're trying to achieve

**I'm here to provide professional, detailed solutions to help you succeed!**

**USTAZ DIGITALS is always here for you.** 🤖
  `;
}

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

    // Chat endpoint
    if (event.httpMethod === 'POST' && path.includes('/chat')) {
      const body = JSON.parse(event.body);
      const { message, sessionId, userId } = body;

      if (!message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message is required' })
        };
      }

      // Get user context if authenticated
      let userContext = {};
      if (userId) {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (user) {
          userContext = {
            name: `${user.firstName} ${user.lastName}`,
            courses: user.courses || [],
            level: user.level || 'beginner'
          };
        }
      }

      // Generate intelligent response
      const response = generateIntelligentResponse(message, userContext);

      // Save conversation to database
      const conversation = {
        sessionId: sessionId || new ObjectId().toString(),
        userId: userId || null,
        message,
        response,
        timestamp: new Date(),
        topics: extractTopics(message.toLowerCase()),
        intent: detectIntent(message.toLowerCase())
      };

      await db.collection('bot_conversations').insertOne(conversation);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response,
          sessionId: conversation.sessionId,
          timestamp: conversation.timestamp
        })
      };
    }

    // Get conversation history
    if (event.httpMethod === 'GET' && path.includes('/history')) {
      const { sessionId } = event.queryStringParameters || {};
      
      if (!sessionId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Session ID is required' })
        };
      }

      const conversations = await db.collection('bot_conversations')
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(conversations)
      };
    }

    // Analytics endpoint for admin
    if (event.httpMethod === 'GET' && path.includes('/analytics')) {
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No authorization header' })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Admin access required' })
        };
      }

      const [
        totalConversations,
        uniqueSessions,
        topTopics,
        recentChats
      ] = await Promise.all([
        db.collection('bot_conversations').countDocuments(),
        db.collection('bot_conversations').distinct('sessionId').then(sessions => sessions.length),
        db.collection('bot_conversations').aggregate([
          { $unwind: '$topics' },
          { $group: { _id: '$topics', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).toArray(),
        db.collection('bot_conversations').find({}).sort({ timestamp: -1 }).limit(20).toArray()
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalConversations,
          uniqueSessions,
          topTopics,
          recentChats
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('USTAZ BOT error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};