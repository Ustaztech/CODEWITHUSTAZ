const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

function generateMatricNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CWU/${year}/${random}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: 'zaiddigitalacademy@gmail.com',
    to,
    subject,
    html
  });
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
    const body = event.body ? JSON.parse(event.body) : {};
    const { path } = event;

    // Submit admission application
    if (event.httpMethod === 'POST' && path.includes('/apply')) {
      const {
        firstName, lastName, email, phone, dob, gender, address,
        course, education, experience, motivation, referral
      } = body;

      if (!firstName || !lastName || !email || !phone || !course) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Required fields missing' })
        };
      }

      const applicationId = 'APP' + Date.now().toString().slice(-6);
      
      const application = {
        applicationId,
        firstName,
        lastName,
        email,
        phone,
        dob,
        gender,
        address,
        course,
        education,
        experience,
        motivation,
        referral,
        status: 'pending',
        paymentStatus: 'pending',
        submittedAt: new Date(),
        admissionFee: 1000
      };

      await db.collection('admissions').insertOne(application);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Application submitted successfully',
          applicationId,
          paymentDetails: {
            amount: 1000,
            whatsapp: '08168985912',
            instructions: 'Send payment proof to WhatsApp: 08168985912'
          }
        })
      };
    }

    // Get all applications (admin only)
    if (event.httpMethod === 'GET' && path.includes('/applications')) {
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

      const applications = await db.collection('admissions').find({}).sort({ submittedAt: -1 }).toArray();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(applications)
      };
    }

    // Approve/Reject application
    if (event.httpMethod === 'PUT' && path.includes('/applications/')) {
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

      const applicationId = path.split('/').pop();
      const { action, reason } = body;

      const application = await db.collection('admissions').findOne({ 
        _id: new ObjectId(applicationId) 
      });

      if (!application) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Application not found' })
        };
      }

      if (action === 'approve') {
        const matricNumber = generateMatricNumber();
        const password = generatePassword();

        // Update application
        await db.collection('admissions').updateOne(
          { _id: new ObjectId(applicationId) },
          {
            $set: {
              status: 'approved',
              matricNumber,
              password,
              approvedAt: new Date(),
              approvedBy: decoded.userId
            }
          }
        );

        // Create user account
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);

        await db.collection('users').insertOne({
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          password: hashedPassword,
          phone: application.phone,
          gender: application.gender,
          role: 'student',
          matricNumber,
          course: application.course,
          admissionId: applicationId,
          createdAt: new Date(),
          isActive: true
        });

        // Send approval email
        const emailHtml = `
          <h2>🎉 Congratulations! Admission Approved</h2>
          <p>Dear ${application.firstName} ${application.lastName},</p>
          <p>Your admission to <strong>CODEWITHUSTAZ</strong> has been approved!</p>
          <h3>Your Login Details:</h3>
          <p><strong>Matric Number:</strong> ${matricNumber}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Course:</strong> ${application.course}</p>
          <p>Please login to your dashboard to start learning!</p>
          <p>Welcome to the CODEWITHUSTAZ family!</p>
          <p><em>USTAZ DIGITALS is always here for you.</em></p>
        `;

        await sendEmail(application.email, 'Admission Approved - CODEWITHUSTAZ', emailHtml);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Application approved successfully',
            matricNumber,
            password
          })
        };

      } else if (action === 'reject') {
        await db.collection('admissions').updateOne(
          { _id: new ObjectId(applicationId) },
          {
            $set: {
              status: 'rejected',
              rejectionReason: reason,
              rejectedAt: new Date(),
              rejectedBy: decoded.userId
            }
          }
        );

        // Send rejection email
        const emailHtml = `
          <h2>Admission Application Update</h2>
          <p>Dear ${application.firstName} ${application.lastName},</p>
          <p>Thank you for your interest in CODEWITHUSTAZ.</p>
          <p>Unfortunately, we cannot approve your application at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You are welcome to reapply in the future.</p>
          <p>Best regards,<br>CODEWITHUSTAZ Admissions Team</p>
        `;

        await sendEmail(application.email, 'Admission Application Update - CODEWITHUSTAZ', emailHtml);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Application rejected' })
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Admissions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};