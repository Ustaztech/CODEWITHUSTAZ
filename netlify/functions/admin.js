const { MongoClient } = require('mongodb');
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

    // Admin login with code
    if (event.httpMethod === 'POST' && path.includes('/admin-login')) {
      const { code } = body;

      if (code !== process.env.ADMIN_CODE || code !== 'USTAZ2024ADMIN') {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid admin code' })
        };
      }

      const token = jwt.sign(
        { role: 'admin', adminAccess: true },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token, message: 'Admin access granted' })
      };
    }

    // Get dashboard statistics
    if (event.httpMethod === 'GET' && path.includes('/dashboard-stats')) {
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
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalStudents,
        recentApplications
      ] = await Promise.all([
        db.collection('admissions').countDocuments(),
        db.collection('admissions').countDocuments({ status: 'pending' }),
        db.collection('admissions').countDocuments({ status: 'approved' }),
        db.collection('admissions').countDocuments({ status: 'rejected' }),
        db.collection('users').countDocuments({ role: 'student' }),
        db.collection('admissions').find({}).sort({ submittedAt: -1 }).limit(5).toArray()
      ]);

      const stats = {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalStudents,
        recentApplications
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Admin error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};