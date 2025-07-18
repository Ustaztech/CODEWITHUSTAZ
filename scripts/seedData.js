const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codewithustaz-lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});
    
    console.log('🗑️ Cleared existing data');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      firstName: 'Yahaya',
      lastName: 'Zaid',
      email: 'admin@codewithustaz.com',
      password: adminPassword,
      phone: '+2348168985912',
      gender: 'male',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
    
    console.log('👤 Created admin user');
    
    // Create instructor
    const instructorPassword = await bcrypt.hash('instructor123', 12);
    const instructor = await User.create({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'instructor@codewithustaz.com',
      password: instructorPassword,
      phone: '+2348123456789',
      gender: 'female',
      role: 'instructor',
      isActive: true,
      isEmailVerified: true
    });
    
    console.log('👩‍🏫 Created instructor user');
    
    // Create sample student
    const studentPassword = await bcrypt.hash('student123', 12);
    const student = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'student@codewithustaz.com',
      password: studentPassword,
      phone: '+2348987654321',
      gender: 'male',
      role: 'student',
      matricNumber: 'CWU/2024/0001',
      isActive: true,
      isEmailVerified: true
    });
    
    console.log('👨‍🎓 Created student user');
    
    // Create beginner practice courses
    const courses = [
      {
        title: 'HTML Fundamentals',
        slug: 'html-fundamentals',
        description: 'Learn the basics of HTML structure and elements',
        longDescription: 'Master the foundation of web development with HTML. This course covers all essential HTML elements, semantic markup, forms, and best practices.',
        category: 'web-development',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 8,
        isPublished: true,
        isFree: true,
        prerequisites: [],
        learningOutcomes: [
          'Understand HTML document structure',
          'Create semantic HTML markup',
          'Build forms and handle user input',
          'Implement accessibility best practices'
        ],
        tags: ['html', 'web-development', 'frontend', 'beginner'],
        modules: [
          {
            id: 'module-1',
            title: 'Getting Started with HTML',
            description: 'Introduction to HTML and basic structure',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'What is HTML?',
                description: 'Understanding HTML and its role in web development',
                content: `
                  <h3>What is HTML?</h3>
                  <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages and web applications.</p>
                  
                  <h4>Key Points:</h4>
                  <ul>
                    <li>HTML describes the structure of web pages using markup</li>
                    <li>HTML elements are represented by tags</li>
                    <li>Tags usually come in pairs: opening and closing</li>
                    <li>HTML documents have a specific structure</li>
                  </ul>
                  
                  <h4>Basic HTML Structure:</h4>
                  <pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
    &lt;title&gt;My First Web Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Welcome to HTML!&lt;/h1&gt;
    &lt;p&gt;This is my first HTML document.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
                  
                  <h4>Understanding the Structure:</h4>
                  <ul>
                    <li><strong>&lt;!DOCTYPE html&gt;</strong> - Declares the document type</li>
                    <li><strong>&lt;html&gt;</strong> - Root element of the page</li>
                    <li><strong>&lt;head&gt;</strong> - Contains metadata about the document</li>
                    <li><strong>&lt;body&gt;</strong> - Contains the visible content</li>
                  </ul>
                `,
                duration: 15,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'What does HTML stand for?',
                  options: [
                    'HyperText Markup Language',
                    'High Tech Modern Language',
                    'Home Tool Markup Language',
                    'Hyperlink and Text Markup Language'
                  ],
                  correctAnswer: 0,
                  explanation: 'HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages.',
                  points: 10
                }
              },
              {
                id: 'lesson-1-2',
                title: 'HTML Elements and Tags',
                description: 'Learn about different HTML elements and how to use them',
                content: `
                  <h3>HTML Elements and Tags</h3>
                  <p>HTML elements are the building blocks of web pages. They are defined by tags.</p>
                  
                  <h4>Common HTML Elements:</h4>
                  
                  <h5>Headings:</h5>
                  <pre><code>&lt;h1&gt;Main Heading&lt;/h1&gt;
&lt;h2&gt;Sub Heading&lt;/h2&gt;
&lt;h3&gt;Sub-sub Heading&lt;/h3&gt;
&lt;h4&gt;Level 4 Heading&lt;/h4&gt;
&lt;h5&gt;Level 5 Heading&lt;/h5&gt;
&lt;h6&gt;Level 6 Heading&lt;/h6&gt;</code></pre>
                  
                  <h5>Paragraphs and Text Formatting:</h5>
                  <pre><code>&lt;p&gt;This is a paragraph of text.&lt;/p&gt;
&lt;strong&gt;Bold text&lt;/strong&gt;
&lt;em&gt;Italic text&lt;/em&gt;
&lt;u&gt;Underlined text&lt;/u&gt;
&lt;mark&gt;Highlighted text&lt;/mark&gt;</code></pre>
                  
                  <h5>Lists:</h5>
                  <pre><code>&lt;!-- Unordered List --&gt;
&lt;ul&gt;
  &lt;li&gt;First item&lt;/li&gt;
  &lt;li&gt;Second item&lt;/li&gt;
  &lt;li&gt;Third item&lt;/li&gt;
&lt;/ul&gt;

&lt;!-- Ordered List --&gt;
&lt;ol&gt;
  &lt;li&gt;First step&lt;/li&gt;
  &lt;li&gt;Second step&lt;/li&gt;
  &lt;li&gt;Third step&lt;/li&gt;
&lt;/ol&gt;</code></pre>
                  
                  <h5>Links and Images:</h5>
                  <pre><code>&lt;a href="https://example.com"&gt;Visit Example&lt;/a&gt;
&lt;img src="image.jpg" alt="Description of image"&gt;</code></pre>
                  
                  <h4>Best Practices:</h4>
                  <ul>
                    <li>Always close your tags</li>
                    <li>Use lowercase for tag names</li>
                    <li>Include alt attributes for images</li>
                    <li>Use semantic HTML elements</li>
                  </ul>
                `,
                duration: 20,
                order: 2,
                quiz: {
                  question: 'Which tag is used for the largest heading?',
                  options: ['<h1>', '<h6>', '<header>', '<title>'],
                  correctAnswer: 0,
                  explanation: 'The <h1> tag is used for the largest heading. Headings go from <h1> (largest) to <h6> (smallest).',
                  points: 10
                },
                practiceExercise: {
                  title: 'Create Your First HTML Page',
                  description: 'Create a simple HTML page with a heading, paragraph, and list.',
                  starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Practice Page</title>
</head>
<body>
    <!-- Add your content here -->
    
</body>
</html>`,
                  solution: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Practice Page</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my first HTML practice page.</p>
    <ul>
        <li>HTML is fun</li>
        <li>I'm learning web development</li>
        <li>Practice makes perfect</li>
    </ul>
</body>
</html>`,
                  hints: [
                    'Start with an <h1> tag for your main heading',
                    'Use <p> tags for paragraphs',
                    'Create a list with <ul> and <li> tags'
                  ]
                }
              }
            ]
          },
          {
            id: 'module-2',
            title: 'HTML Forms and Input',
            description: 'Learn how to create forms and handle user input',
            order: 2,
            lessons: [
              {
                id: 'lesson-2-1',
                title: 'Creating Forms',
                description: 'Learn how to create HTML forms for user input',
                content: `
                  <h3>HTML Forms</h3>
                  <p>Forms are used to collect user input and send it to a server for processing.</p>
                  
                  <h4>Basic Form Structure:</h4>
                  <pre><code>&lt;form action="/submit" method="POST"&gt;
    &lt;label for="name"&gt;Name:&lt;/label&gt;
    &lt;input type="text" id="name" name="name" required&gt;
    
    &lt;label for="email"&gt;Email:&lt;/label&gt;
    &lt;input type="email" id="email" name="email" required&gt;
    
    &lt;button type="submit"&gt;Submit&lt;/button&gt;
&lt;/form&gt;</code></pre>
                  
                  <h4>Common Input Types:</h4>
                  <ul>
                    <li><strong>text</strong> - Single-line text input</li>
                    <li><strong>email</strong> - Email address input</li>
                    <li><strong>password</strong> - Password input (hidden text)</li>
                    <li><strong>number</strong> - Numeric input</li>
                    <li><strong>date</strong> - Date picker</li>
                    <li><strong>checkbox</strong> - Checkbox for multiple selections</li>
                    <li><strong>radio</strong> - Radio button for single selection</li>
                    <li><strong>file</strong> - File upload</li>
                  </ul>
                  
                  <h4>Form Attributes:</h4>
                  <ul>
                    <li><strong>action</strong> - Where to send form data</li>
                    <li><strong>method</strong> - How to send data (GET or POST)</li>
                    <li><strong>required</strong> - Makes field mandatory</li>
                    <li><strong>placeholder</strong> - Hint text in input</li>
                  </ul>
                `,
                duration: 25,
                order: 1,
                quiz: {
                  question: 'Which input type is best for collecting email addresses?',
                  options: ['text', 'email', 'password', 'url'],
                  correctAnswer: 1,
                  explanation: 'The "email" input type provides built-in email validation and shows an appropriate keyboard on mobile devices.',
                  points: 10
                }
              }
            ]
          }
        ]
      },
      {
        title: 'CSS Styling Basics',
        slug: 'css-styling-basics',
        description: 'Learn how to style HTML elements with CSS',
        longDescription: 'Discover the power of CSS to transform plain HTML into beautiful, responsive web pages. Learn selectors, properties, layout techniques, and modern CSS features.',
        category: 'web-development',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 10,
        isPublished: true,
        isFree: true,
        prerequisites: ['HTML Fundamentals'],
        learningOutcomes: [
          'Apply CSS styles to HTML elements',
          'Use CSS selectors effectively',
          'Create responsive layouts',
          'Implement modern CSS techniques'
        ],
        tags: ['css', 'web-development', 'styling', 'frontend'],
        modules: [
          {
            id: 'module-1',
            title: 'CSS Fundamentals',
            description: 'Introduction to CSS and basic styling',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'Introduction to CSS',
                description: 'Understanding CSS and how it works with HTML',
                content: `
                  <h3>What is CSS?</h3>
                  <p>CSS (Cascading Style Sheets) is used to style and layout web pages. It describes how HTML elements should be displayed.</p>
                  
                  <h4>CSS Syntax:</h4>
                  <pre><code>selector {
    property: value;
    property: value;
}</code></pre>
                  
                  <h4>Ways to Add CSS:</h4>
                  <ol>
                    <li><strong>Inline CSS:</strong> Using the style attribute</li>
                    <li><strong>Internal CSS:</strong> Using &lt;style&gt; tag in the head</li>
                    <li><strong>External CSS:</strong> Linking to a separate .css file</li>
                  </ol>
                  
                  <h5>External CSS (Recommended):</h5>
                  <pre><code>&lt;!-- In HTML head --&gt;
&lt;link rel="stylesheet" href="styles.css"&gt;

/* In styles.css */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}</code></pre>
                  
                  <h4>Basic Selectors:</h4>
                  <pre><code>/* Element selector */
p {
    color: blue;
    font-size: 16px;
}

/* Class selector */
.highlight {
    background-color: yellow;
}

/* ID selector */
#header {
    font-size: 24px;
    font-weight: bold;
}</code></pre>
                `,
                duration: 18,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'What does CSS stand for?',
                  options: [
                    'Cascading Style Sheets',
                    'Computer Style Sheets',
                    'Creative Style Sheets',
                    'Colorful Style Sheets'
                  ],
                  correctAnswer: 0,
                  explanation: 'CSS stands for Cascading Style Sheets. The "cascading" refers to how styles can inherit and override each other.',
                  points: 10
                }
              }
            ]
          }
        ]
      },
      {
        title: 'JavaScript Fundamentals',
        slug: 'javascript-fundamentals',
        description: 'Learn the basics of JavaScript programming',
        longDescription: 'Master the fundamentals of JavaScript, the programming language of the web. Learn variables, functions, DOM manipulation, and modern JavaScript features.',
        category: 'programming',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 12,
        isPublished: true,
        isFree: true,
        prerequisites: ['HTML Fundamentals', 'CSS Styling Basics'],
        learningOutcomes: [
          'Understand JavaScript syntax and concepts',
          'Work with variables and data types',
          'Create and use functions',
          'Manipulate the DOM'
        ],
        tags: ['javascript', 'programming', 'web-development', 'frontend'],
        modules: [
          {
            id: 'module-1',
            title: 'JavaScript Basics',
            description: 'Introduction to JavaScript programming',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'JavaScript Introduction',
                description: 'Getting started with JavaScript',
                content: `
                  <h3>What is JavaScript?</h3>
                  <p>JavaScript is a programming language that makes web pages interactive. It can update and change both HTML and CSS.</p>
                  
                  <h4>Variables:</h4>
                  <pre><code>// Modern way (ES6+)
let name = "John";
const age = 25;

// Older way (avoid in modern code)
var city = "Lagos";</code></pre>
                  
                  <h4>Data Types:</h4>
                  <ul>
                    <li><strong>String:</strong> "Hello World", 'JavaScript'</li>
                    <li><strong>Number:</strong> 42, 3.14, -10</li>
                    <li><strong>Boolean:</strong> true, false</li>
                    <li><strong>Array:</strong> [1, 2, 3, "hello"]</li>
                    <li><strong>Object:</strong> {name: "John", age: 25}</li>
                    <li><strong>Undefined:</strong> Variable declared but not assigned</li>
                    <li><strong>Null:</strong> Intentionally empty value</li>
                  </ul>
                  
                  <h4>Functions:</h4>
                  <pre><code>// Function declaration
function greet(name) {
    return "Hello, " + name + "!";
}

// Function expression
const greet2 = function(name) {
    return \`Hello, \${name}!\`;
};

// Arrow function (ES6+)
const greet3 = (name) => \`Hello, \${name}!\`;

// Using the function
console.log(greet("World")); // "Hello, World!"</code></pre>
                  
                  <h4>Basic Operations:</h4>
                  <pre><code>// Arithmetic
let sum = 10 + 5;        // 15
let difference = 10 - 5; // 5
let product = 10 * 5;    // 50
let quotient = 10 / 5;   // 2

// String concatenation
let fullName = "John" + " " + "Doe";
let greeting = \`Hello, \${fullName}!\`; // Template literal</code></pre>
                `,
                duration: 22,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'Which keyword is used to declare a constant in JavaScript?',
                  options: ['var', 'let', 'const', 'constant'],
                  correctAnswer: 2,
                  explanation: 'The "const" keyword is used to declare constants in JavaScript. Once assigned, the value cannot be changed.',
                  points: 10
                }
              }
            ]
          }
        ]
      },
      {
        title: 'Python Basics',
        slug: 'python-basics',
        description: 'Introduction to Python programming language',
        longDescription: 'Start your programming journey with Python, one of the most popular and beginner-friendly programming languages. Learn syntax, data structures, and problem-solving.',
        category: 'programming',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 14,
        isPublished: true,
        isFree: true,
        prerequisites: [],
        learningOutcomes: [
          'Understand Python syntax and structure',
          'Work with variables and data types',
          'Use control structures and loops',
          'Create and use functions'
        ],
        tags: ['python', 'programming', 'beginner', 'data-science'],
        modules: [
          {
            id: 'module-1',
            title: 'Python Introduction',
            description: 'Getting started with Python programming',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'Python Basics',
                description: 'Introduction to Python programming',
                content: `
                  <h3>What is Python?</h3>
                  <p>Python is a high-level, interpreted programming language known for its simplicity and readability.</p>
                  
                  <h4>Why Python?</h4>
                  <ul>
                    <li>Easy to learn and read</li>
                    <li>Versatile - web development, data science, AI, automation</li>
                    <li>Large community and extensive libraries</li>
                    <li>Cross-platform compatibility</li>
                  </ul>
                  
                  <h4>Variables and Data Types:</h4>
                  <pre><code># Variables (no declaration needed)
name = "Alice"
age = 30
height = 5.6
is_student = True

# Python is dynamically typed
x = 10        # integer
x = "hello"   # now it's a string
x = [1, 2, 3] # now it's a list</code></pre>
                  
                  <h4>Basic Data Types:</h4>
                  <ul>
                    <li><strong>int:</strong> 42, -10, 0</li>
                    <li><strong>float:</strong> 3.14, -2.5, 0.0</li>
                    <li><strong>str:</strong> "Hello", 'World', """Multi-line"""</li>
                    <li><strong>bool:</strong> True, False</li>
                    <li><strong>list:</strong> [1, 2, 3], ["a", "b", "c"]</li>
                    <li><strong>dict:</strong> {"name": "John", "age": 25}</li>
                  </ul>
                  
                  <h4>Lists and Dictionaries:</h4>
                  <pre><code># Lists (ordered, mutable)
fruits = ["apple", "banana", "orange"]
print(fruits[0])    # "apple"
fruits.append("grape")
print(len(fruits))  # 4

# Dictionaries (key-value pairs)
person = {
    "name": "John",
    "age": 25,
    "city": "Lagos"
}
print(person["name"])  # "John"
person["email"] = "john@example.com"</code></pre>
                  
                  <h4>Functions:</h4>
                  <pre><code>def greet(name):
    return f"Hello, {name}!"

def add_numbers(a, b):
    return a + b

# Using functions
message = greet("World")
print(message)  # "Hello, World!"

result = add_numbers(5, 3)
print(result)   # 8</code></pre>
                `,
                duration: 25,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'How do you print "Hello World" in Python?',
                  options: [
                    'print("Hello World")',
                    'console.log("Hello World")',
                    'echo "Hello World"',
                    'System.out.println("Hello World")'
                  ],
                  correctAnswer: 0,
                  explanation: 'In Python, you use the print() function to display output to the console.',
                  points: 10
                }
              }
            ]
          }
        ]
      },
      {
        title: 'Web Design Principles',
        slug: 'web-design-principles',
        description: 'Learn fundamental web design concepts',
        longDescription: 'Master the art of web design with fundamental principles, color theory, typography, and user experience design. Create visually appealing and user-friendly websites.',
        category: 'design',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 6,
        isPublished: true,
        isFree: true,
        prerequisites: [],
        learningOutcomes: [
          'Apply design principles to web projects',
          'Understand color theory and typography',
          'Create user-friendly interfaces',
          'Design responsive layouts'
        ],
        tags: ['design', 'ui', 'ux', 'web-design', 'principles'],
        modules: [
          {
            id: 'module-1',
            title: 'Design Fundamentals',
            description: 'Core principles of good web design',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'Design Principles',
                description: 'Essential principles for effective web design',
                content: `
                  <h3>Key Design Principles</h3>
                  <p>Good web design follows established principles that create visually appealing and functional websites.</p>
                  
                  <h4>1. Visual Hierarchy</h4>
                  <p>Guide users' attention through the strategic use of:</p>
                  <ul>
                    <li><strong>Size:</strong> Larger elements draw more attention</li>
                    <li><strong>Color:</strong> Bright or contrasting colors stand out</li>
                    <li><strong>Position:</strong> Top-left gets noticed first (in Western cultures)</li>
                    <li><strong>Typography:</strong> Bold, italic, or different fonts create emphasis</li>
                  </ul>
                  
                  <h4>2. Color Theory</h4>
                  <p>Understanding color relationships and psychology:</p>
                  <ul>
                    <li><strong>Primary colors:</strong> Red, Blue, Yellow</li>
                    <li><strong>Secondary colors:</strong> Green, Orange, Purple</li>
                    <li><strong>Complementary colors:</strong> Opposite on color wheel (high contrast)</li>
                    <li><strong>Analogous colors:</strong> Adjacent on color wheel (harmonious)</li>
                    <li><strong>Color psychology:</strong> Blue = trust, Red = urgency, Green = nature</li>
                  </ul>
                  
                  <h4>3. Typography</h4>
                  <p>Effective text presentation:</p>
                  <ul>
                    <li><strong>Readability:</strong> Choose clear, legible fonts</li>
                    <li><strong>Hierarchy:</strong> Use different sizes for headings and body text</li>
                    <li><strong>Consistency:</strong> Limit to 2-3 font families maximum</li>
                    <li><strong>Line spacing:</strong> 1.4-1.6 times the font size for body text</li>
                    <li><strong>Contrast:</strong> Ensure sufficient contrast between text and background</li>
                  </ul>
                  
                  <h4>4. White Space (Negative Space)</h4>
                  <p>The empty space around elements:</p>
                  <ul>
                    <li>Improves readability and comprehension</li>
                    <li>Creates focus on important elements</li>
                    <li>Makes design feel less cluttered</li>
                    <li>Conveys elegance and professionalism</li>
                  </ul>
                  
                  <h4>5. Responsive Design</h4>
                  <p>Design that works on all devices:</p>
                  <ul>
                    <li><strong>Mobile-first:</strong> Start with mobile design, then scale up</li>
                    <li><strong>Flexible grids:</strong> Use percentages instead of fixed pixels</li>
                    <li><strong>Flexible images:</strong> Images that scale with container</li>
                    <li><strong>Media queries:</strong> CSS rules for different screen sizes</li>
                  </ul>
                  
                  <h4>6. User Experience (UX)</h4>
                  <p>Design with the user in mind:</p>
                  <ul>
                    <li><strong>Intuitive navigation:</strong> Users should know where they are and where they can go</li>
                    <li><strong>Fast loading:</strong> Optimize images and code for speed</li>
                    <li><strong>Accessibility:</strong> Design for users with disabilities</li>
                    <li><strong>Consistency:</strong> Similar elements should look and behave similarly</li>
                  </ul>
                `,
                duration: 20,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'What is visual hierarchy in web design?',
                  options: [
                    'Organizing content by importance to guide user attention',
                    'Using only one color throughout the design',
                    'Making all elements the same size',
                    'Hiding important information from users'
                  ],
                  correctAnswer: 0,
                  explanation: 'Visual hierarchy is about organizing and presenting content in a way that guides users to the most important information first.',
                  points: 10
                }
              }
            ]
          }
        ]
      },
      {
        title: 'Introduction to Programming',
        slug: 'introduction-to-programming',
        description: 'Basic programming concepts and logic',
        longDescription: 'Start your programming journey with fundamental concepts that apply to all programming languages. Learn problem-solving, algorithms, and computational thinking.',
        category: 'programming',
        level: 'beginner',
        price: 0,
        instructor: instructor._id,
        estimatedDuration: 8,
        isPublished: true,
        isFree: true,
        prerequisites: [],
        learningOutcomes: [
          'Understand fundamental programming concepts',
          'Develop problem-solving skills',
          'Learn about algorithms and data structures',
          'Apply computational thinking'
        ],
        tags: ['programming', 'fundamentals', 'logic', 'algorithms'],
        modules: [
          {
            id: 'module-1',
            title: 'Programming Fundamentals',
            description: 'Core concepts every programmer should know',
            order: 1,
            lessons: [
              {
                id: 'lesson-1-1',
                title: 'What is Programming?',
                description: 'Understanding programming and computational thinking',
                content: `
                  <h3>What is Programming?</h3>
                  <p>Programming is the process of creating instructions for computers to solve problems and perform tasks.</p>
                  
                  <h4>Key Concepts:</h4>
                  
                  <h5>1. Variables</h5>
                  <p>Containers that store data values:</p>
                  <ul>
                    <li>Think of them as labeled boxes that hold information</li>
                    <li>Can store different types of data (numbers, text, true/false)</li>
                    <li>Values can be changed during program execution</li>
                  </ul>
                  
                  <h5>2. Data Types</h5>
                  <p>Different kinds of information computers can work with:</p>
                  <ul>
                    <li><strong>Numbers:</strong> Integers (1, 2, 3) and decimals (3.14, 2.5)</li>
                    <li><strong>Text (Strings):</strong> Words, sentences, or any characters</li>
                    <li><strong>Booleans:</strong> True or False values</li>
                    <li><strong>Lists/Arrays:</strong> Collections of related items</li>
                    <li><strong>Objects:</strong> Complex data with multiple properties</li>
                  </ul>
                  
                  <h5>3. Control Structures</h5>
                  <p>Ways to control the flow of your program:</p>
                  <ul>
                    <li><strong>Conditions (if/else):</strong> Make decisions based on data</li>
                    <li><strong>Loops:</strong> Repeat actions multiple times</li>
                    <li><strong>Functions:</strong> Reusable blocks of code</li>
                  </ul>
                  
                  <h4>Problem Solving Steps</h4>
                  <p>Every programming problem can be solved using this approach:</p>
                  <ol>
                    <li><strong>Understand the problem:</strong> What exactly needs to be solved?</li>
                    <li><strong>Break it down:</strong> Divide complex problems into smaller parts</li>
                    <li><strong>Plan the solution:</strong> Write out the steps in plain language</li>
                    <li><strong>Write the code:</strong> Translate your plan into programming language</li>
                    <li><strong>Test and debug:</strong> Run your code and fix any errors</li>
                    <li><strong>Optimize:</strong> Make your code faster or more efficient</li>
                  </ol>
                  
                  <h4>Example: Making a Sandwich (Algorithm)</h4>
                  <p>Programming is like writing detailed instructions:</p>
                  <ol>
                    <li>Get two slices of bread</li>
                    <li>Open jar of peanut butter</li>
                    <li>Get a knife</li>
                    <li>Spread peanut butter on one slice</li>
                    <li>Open jar of jelly</li>
                    <li>Spread jelly on the other slice</li>
                    <li>Put the slices together</li>
                    <li>Clean up</li>
                  </ol>
                  
                  <h4>Computational Thinking</h4>
                  <p>The mental process programmers use:</p>
                  <ul>
                    <li><strong>Decomposition:</strong> Breaking problems into smaller parts</li>
                    <li><strong>Pattern Recognition:</strong> Finding similarities and trends</li>
                    <li><strong>Abstraction:</strong> Focusing on important details, ignoring irrelevant ones</li>
                    <li><strong>Algorithms:</strong> Creating step-by-step solutions</li>
                  </ul>
                  
                  <h4>Why Learn Programming?</h4>
                  <ul>
                    <li><strong>Problem-solving skills:</strong> Logical thinking applies everywhere</li>
                    <li><strong>Career opportunities:</strong> High demand in many industries</li>
                    <li><strong>Creativity:</strong> Build apps, websites, games, and more</li>
                    <li><strong>Automation:</strong> Make computers do repetitive tasks</li>
                    <li><strong>Understanding technology:</strong> Better grasp of how digital world works</li>
                  </ul>
                `,
                duration: 18,
                order: 1,
                isPreview: true,
                quiz: {
                  question: 'What is a variable in programming?',
                  options: [
                    'A container that stores data values',
                    'A type of loop that repeats code',
                    'A programming language',
                    'An error in the code'
                  ],
                  correctAnswer: 0,
                  explanation: 'A variable is like a labeled container that stores data values. The value can be changed (varied) during program execution.',
                  points: 10
                }
              }
            ]
          }
        ]
      }
    ];
    
    // Create courses
    const createdCourses = await Course.insertMany(courses);
    console.log(`📚 Created ${createdCourses.length} practice courses`);
    
    // Create sample progress for student
    const sampleProgress = new Progress({
      user: student._id,
      course: createdCourses[0]._id, // HTML Fundamentals
      enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      overallProgress: 25,
      moduleProgress: [
        {
          moduleId: 'module-1',
          progress: 50,
          completedLessons: [
            {
              lessonId: 'lesson-1-1',
              completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              timeSpent: 15,
              score: 100,
              attempts: 1
            }
          ],
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ],
      activities: [
        {
          type: 'lesson_start',
          lessonId: 'lesson-1-1',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'lesson_complete',
          lessonId: 'lesson-1-1',
          duration: 900, // 15 minutes in seconds
          score: 100,
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      ],
      statistics: {
        totalTimeSpent: 15,
        lessonsCompleted: 1,
        quizzesCompleted: 1,
        averageQuizScore: 100,
        currentStreak: 1,
        longestStreak: 1
      },
      achievements: [
        {
          type: 'first_lesson',
          earnedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          data: { lessonId: 'lesson-1-1' }
        }
      ]
    });
    
    await sampleProgress.save();
    console.log('📈 Created sample progress data');
    
    // Update student enrollment
    student.enrolledCourses.push({
      courseId: createdCourses[0]._id,
      enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      progress: 25,
      completedLessons: [
        {
          lessonId: 'lesson-1-1',
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          timeSpent: 15,
          score: 100
        }
      ]
    });
    
    student.learningStats.totalTimeSpent = 15;
    student.learningStats.lessonsCompleted = 1;
    student.learningStats.currentStreak = 1;
    student.learningStats.longestStreak = 1;
    student.learningStats.lastActivityDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    
    await student.save();
    console.log('👨‍🎓 Updated student enrollment data');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin: admin@codewithustaz.com / admin123');
    console.log('👩‍🏫 Instructor: instructor@codewithustaz.com / instructor123');
    console.log('👨‍🎓 Student: student@codewithustaz.com / student123');
    console.log('\n🚀 Start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();