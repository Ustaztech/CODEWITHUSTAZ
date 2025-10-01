// Fallback data for when database is not available
class FallbackLMS {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('lms_users') || '[]');
    this.courses = this.getDefaultCourses();
    this.progress = JSON.parse(localStorage.getItem('lms_progress') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('lms_current_user') || 'null');
  }

  saveToStorage() {
    localStorage.setItem('lms_users', JSON.stringify(this.users));
    localStorage.setItem('lms_progress', JSON.stringify(this.progress));
    localStorage.setItem('lms_current_user', JSON.stringify(this.currentUser));
  }

  getDefaultCourses() {
    return [
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
              },
              {
                id: 'lesson-1-2',
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
&lt;/ul&gt;</code></pre>
                `,
                duration: 20,
                quiz: {
                  question: 'Which tag is used for the largest heading?',
                  options: ['<h1>', '<h6>', '<header>', '<title>'],
                  correctAnswer: 0,
                  explanation: 'The <h1> tag is used for the largest heading.'
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
  }

  // Authentication methods
  async register(userData) {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: 'student',
      createdAt: new Date(),
      enrolledCourses: [],
      learningStats: {
        totalTimeSpent: 0,
        lessonsCompleted: 0,
        coursesCompleted: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    this.saveToStorage();

    return {
      token: 'fallback-token-' + newUser.id,
      user: newUser
    };
  }

  async login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    this.currentUser = user;
    this.saveToStorage();

    return {
      token: 'fallback-token-' + user.id,
      user
    };
  }

  async getDashboard() {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    const userProgress = this.progress.filter(p => p.userId === this.currentUser.id);
    const enrolledCourses = this.courses.map(course => {
      const courseProgress = userProgress.filter(p => p.courseId === course.id);
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
      user: this.currentUser,
      courses: enrolledCourses,
      stats: {
        enrolledCourses: enrolledCourses.length,
        completedCourses: enrolledCourses.filter(c => c.progress === 100).length,
        totalTimeSpent: this.currentUser.learningStats.totalTimeSpent,
        currentStreak: this.currentUser.learningStats.currentStreak
      }
    };
  }

  async getCourse(courseId) {
    return this.courses.find(c => c.id === courseId);
  }

  async updateProgress(progressData) {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    const existingProgress = this.progress.find(p => 
      p.userId === this.currentUser.id && 
      p.courseId === progressData.courseId && 
      p.lessonId === progressData.lessonId
    );

    if (existingProgress) {
      Object.assign(existingProgress, progressData);
    } else {
      this.progress.push({
        userId: this.currentUser.id,
        ...progressData,
        completedAt: new Date()
      });
    }

    // Update user stats
    if (progressData.completed) {
      this.currentUser.learningStats.lessonsCompleted += 1;
      this.currentUser.learningStats.totalTimeSpent += progressData.timeSpent || 0;
    }

    this.saveToStorage();
    return { message: 'Progress updated successfully' };
  }
}

// Global fallback instance
window.fallbackLMS = new FallbackLMS();