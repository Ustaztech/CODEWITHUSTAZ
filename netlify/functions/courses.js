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

const practiceCourses = [
  {
    id: 'html-fundamentals',
    title: 'HTML Fundamentals',
    description: 'Learn the basics of HTML structure and elements',
    icon: 'fab fa-html5',
    color: '#e34f26',
    lessons: [
      {
        id: 1,
        title: 'Introduction to HTML',
        content: `
          <h3>What is HTML?</h3>
          <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
          
          <h4>Basic HTML Structure:</h4>
          <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;My First Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Hello World!&lt;/h1&gt;
    &lt;p&gt;This is my first HTML page.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
          
          <h4>Key Points:</h4>
          <ul>
            <li>HTML uses tags to structure content</li>
            <li>Tags are enclosed in angle brackets &lt; &gt;</li>
            <li>Most tags have opening and closing versions</li>
            <li>The DOCTYPE declaration defines the document type</li>
          </ul>
        `,
        quiz: {
          question: 'What does HTML stand for?',
          options: [
            'HyperText Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlink and Text Markup Language'
          ],
          correct: 0
        }
      },
      {
        id: 2,
        title: 'HTML Elements and Tags',
        content: `
          <h3>Common HTML Elements</h3>
          
          <h4>Headings:</h4>
          <pre><code>&lt;h1&gt;Main Heading&lt;/h1&gt;
&lt;h2&gt;Sub Heading&lt;/h2&gt;
&lt;h3&gt;Sub-sub Heading&lt;/h3&gt;</code></pre>
          
          <h4>Paragraphs and Text:</h4>
          <pre><code>&lt;p&gt;This is a paragraph.&lt;/p&gt;
&lt;strong&gt;Bold text&lt;/strong&gt;
&lt;em&gt;Italic text&lt;/em&gt;</code></pre>
          
          <h4>Lists:</h4>
          <pre><code>&lt;ul&gt;
  &lt;li&gt;Unordered list item&lt;/li&gt;
  &lt;li&gt;Another item&lt;/li&gt;
&lt;/ul&gt;

&lt;ol&gt;
  &lt;li&gt;Ordered list item&lt;/li&gt;
  &lt;li&gt;Second item&lt;/li&gt;
&lt;/ol&gt;</code></pre>
          
          <h4>Links and Images:</h4>
          <pre><code>&lt;a href="https://example.com"&gt;Visit Example&lt;/a&gt;
&lt;img src="image.jpg" alt="Description"&gt;</code></pre>
        `,
        quiz: {
          question: 'Which tag is used for the largest heading?',
          options: ['&lt;h1&gt;', '&lt;h6&gt;', '&lt;header&gt;', '&lt;title&gt;'],
          correct: 0
        }
      }
    ]
  },
  {
    id: 'css-basics',
    title: 'CSS Styling Basics',
    description: 'Learn how to style HTML elements with CSS',
    icon: 'fab fa-css3-alt',
    color: '#1572b6',
    lessons: [
      {
        id: 1,
        title: 'Introduction to CSS',
        content: `
          <h3>What is CSS?</h3>
          <p>CSS (Cascading Style Sheets) is used to style and layout web pages.</p>
          
          <h4>CSS Syntax:</h4>
          <pre><code>selector {
    property: value;
    property: value;
}</code></pre>
          
          <h4>Ways to Add CSS:</h4>
          <ol>
            <li><strong>Inline:</strong> &lt;p style="color: red;"&gt;Text&lt;/p&gt;</li>
            <li><strong>Internal:</strong> &lt;style&gt; in the &lt;head&gt;</li>
            <li><strong>External:</strong> Link to a .css file</li>
          </ol>
          
          <h4>Basic Selectors:</h4>
          <pre><code>/* Element selector */
p { color: blue; }

/* Class selector */
.my-class { font-size: 16px; }

/* ID selector */
#my-id { background: yellow; }</code></pre>
        `,
        quiz: {
          question: 'What does CSS stand for?',
          options: [
            'Cascading Style Sheets',
            'Computer Style Sheets',
            'Creative Style Sheets',
            'Colorful Style Sheets'
          ],
          correct: 0
        }
      }
    ]
  },
  {
    id: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    icon: 'fab fa-js-square',
    color: '#f7df1e',
    lessons: [
      {
        id: 1,
        title: 'JavaScript Basics',
        content: `
          <h3>What is JavaScript?</h3>
          <p>JavaScript is a programming language that makes web pages interactive.</p>
          
          <h4>Variables:</h4>
          <pre><code>let name = "John";
const age = 25;
var city = "Lagos";</code></pre>
          
          <h4>Data Types:</h4>
          <ul>
            <li><strong>String:</strong> "Hello World"</li>
            <li><strong>Number:</strong> 42, 3.14</li>
            <li><strong>Boolean:</strong> true, false</li>
            <li><strong>Array:</strong> [1, 2, 3]</li>
            <li><strong>Object:</strong> {name: "John", age: 25}</li>
          </ul>
          
          <h4>Functions:</h4>
          <pre><code>function greet(name) {
    return "Hello, " + name + "!";
}

console.log(greet("World"));</code></pre>
        `,
        quiz: {
          question: 'Which keyword is used to declare a constant in JavaScript?',
          options: ['var', 'let', 'const', 'constant'],
          correct: 2
        }
      }
    ]
  },
  {
    id: 'python-basics',
    title: 'Python Basics',
    description: 'Introduction to Python programming language',
    icon: 'fab fa-python',
    color: '#3776ab',
    lessons: [
      {
        id: 1,
        title: 'Python Introduction',
        content: `
          <h3>What is Python?</h3>
          <p>Python is a high-level, interpreted programming language known for its simplicity.</p>
          
          <h4>Variables and Data Types:</h4>
          <pre><code>name = "Alice"
age = 30
height = 5.6
is_student = True</code></pre>
          
          <h4>Lists and Dictionaries:</h4>
          <pre><code># Lists
fruits = ["apple", "banana", "orange"]
print(fruits[0])  # apple

# Dictionaries
person = {"name": "John", "age": 25}
print(person["name"])  # John</code></pre>
          
          <h4>Functions:</h4>
          <pre><code>def greet(name):
    return f"Hello, {name}!"

print(greet("World"))</code></pre>
        `,
        quiz: {
          question: 'How do you print "Hello World" in Python?',
          options: [
            'print("Hello World")',
            'console.log("Hello World")',
            'echo "Hello World"',
            'System.out.println("Hello World")'
          ],
          correct: 0
        }
      }
    ]
  },
  {
    id: 'web-design',
    title: 'Web Design Principles',
    description: 'Learn fundamental web design concepts',
    icon: 'fas fa-palette',
    color: '#ff6b6b',
    lessons: [
      {
        id: 1,
        title: 'Design Fundamentals',
        content: `
          <h3>Key Design Principles</h3>
          
          <h4>1. Visual Hierarchy</h4>
          <p>Guide users' attention through size, color, and positioning.</p>
          
          <h4>2. Color Theory</h4>
          <ul>
            <li>Primary colors: Red, Blue, Yellow</li>
            <li>Secondary colors: Green, Orange, Purple</li>
            <li>Use complementary colors for contrast</li>
          </ul>
          
          <h4>3. Typography</h4>
          <ul>
            <li>Choose readable fonts</li>
            <li>Maintain consistent font sizes</li>
            <li>Use proper line spacing</li>
          </ul>
          
          <h4>4. White Space</h4>
          <p>Empty space around elements improves readability and focus.</p>
          
          <h4>5. Responsive Design</h4>
          <p>Design for all screen sizes - mobile, tablet, desktop.</p>
        `,
        quiz: {
          question: 'What is visual hierarchy in web design?',
          options: [
            'Organizing content by importance',
            'Using only one color',
            'Making everything the same size',
            'Hiding important information'
          ],
          correct: 0
        }
      }
    ]
  },
  {
    id: 'programming-intro',
    title: 'Introduction to Programming',
    description: 'Basic programming concepts and logic',
    icon: 'fas fa-code',
    color: '#4ecdc4',
    lessons: [
      {
        id: 1,
        title: 'Programming Fundamentals',
        content: `
          <h3>What is Programming?</h3>
          <p>Programming is giving instructions to a computer to solve problems.</p>
          
          <h4>Key Concepts:</h4>
          
          <h5>1. Variables</h5>
          <p>Containers that store data values.</p>
          
          <h5>2. Data Types</h5>
          <ul>
            <li>Numbers (integers, decimals)</li>
            <li>Text (strings)</li>
            <li>True/False (booleans)</li>
            <li>Lists/Arrays</li>
          </ul>
          
          <h5>3. Control Structures</h5>
          <ul>
            <li><strong>Conditions:</strong> if/else statements</li>
            <li><strong>Loops:</strong> repeat actions</li>
            <li><strong>Functions:</strong> reusable code blocks</li>
          </ul>
          
          <h5>4. Problem Solving Steps</h5>
          <ol>
            <li>Understand the problem</li>
            <li>Break it into smaller parts</li>
            <li>Write the solution step by step</li>
            <li>Test and debug</li>
          </ol>
        `,
        quiz: {
          question: 'What is a variable in programming?',
          options: [
            'A container that stores data',
            'A type of loop',
            'A programming language',
            'An error in code'
          ],
          correct: 0
        }
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

    // Get all practice courses
    if (event.httpMethod === 'GET' && path.includes('/practice-courses')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(practiceCourses)
      };
    }

    // Get specific course
    if (event.httpMethod === 'GET' && path.includes('/course/')) {
      const courseId = path.split('/').pop();
      const course = practiceCourses.find(c => c.id === courseId);
      
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

    // Update progress
    if (event.httpMethod === 'POST' && path.includes('/progress')) {
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
      
      const body = JSON.parse(event.body);
      const { courseId, lessonId, completed, quizScore } = body;

      const progressData = {
        userId: decoded.userId,
        courseId,
        lessonId,
        completed,
        quizScore,
        completedAt: new Date()
      };

      await db.collection('progress').updateOne(
        { userId: decoded.userId, courseId, lessonId },
        { $set: progressData },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Progress updated' })
      };
    }

    // Get user progress
    if (event.httpMethod === 'GET' && path.includes('/my-progress')) {
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
      
      const progress = await db.collection('progress').find({ 
        userId: decoded.userId 
      }).toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(progress)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Courses error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};