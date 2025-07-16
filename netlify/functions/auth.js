const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

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

exports.handler = async (event, context) => {
  // Set CORS headers
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

    // Login endpoint
    if (event.httpMethod === 'POST' && path.includes('/login')) {
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
        process.env.JWT_SECRET,
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
            role: user.role,
            matricNumber: user.matricNumber
          }
        })
      };
    }

    // Register endpoint
    if (event.httpMethod === 'POST' && path.includes('/register')) {
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
        isActive: true
      };

      const result = await db.collection('users').insertOne(newUser);

      const token = jwt.sign(
        { userId: result.insertedId, email, role: 'student' },
        process.env.JWT_SECRET,
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

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};