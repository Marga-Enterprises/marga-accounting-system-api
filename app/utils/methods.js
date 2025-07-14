const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const nodemailer = require('nodemailer');

// get token from headers
exports.getToken = (headers) => {
  if (headers && headers.authorization) {
    const parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    }
  }

  return null;
};


// decode token to get user data
exports.decodeToken = (token) => {
  if (!token) return null;

  try {
      return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
      if (err.name === "TokenExpiredError") {
          console.error("Access token expired:", err);
          return null; 
      }
      throw err; 
  }
};


// generate a new token
exports.generateToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User data is required to generate a token');
  }

  const payload = {
    id: user.id,
    user_username: user.user_username,
    user_fname: user.user_fname,
    user_lname: user.user_lname,
    user_role: user.user_role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '1h' });
};


// send success response
exports.sendSuccess = (v, data, msg = '', sNum = 200, code = 0) => {
  return v.json({
    author: 'Marga Software Development Team',
    msg,
    data,
    success: true,
    version: '0.0.1',
    code
  });
};


// send error response
exports.sendError = (v, data, msg = '', sNum = 400, code = 101) => {
  return v.status(sNum).json({
    author: 'Marga Software Development Team',
    msg,
    data,
    success: false,
    version: '0.0.1',
    code,
  });
};


// send unauthorized response
exports.sendUnauthorizedError = (v, data, msg = '', sNum = 401, code = 102) => {
  return v.status(sNum).json({
    author: 'Marga Software Development Team',
    msg,
    data,
    success: false,
    version: '0.0.1',
    code,
  });
};


// hash password
exports.hashPassword = async (password) => {
  if (!password) throw new Error('Password is required for hashing');

  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};


// compare password
exports.comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) throw new Error('Both password and hashed password are required for comparison');

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing password:', error);
    throw error;
  }
};


// create a nodemailer transporter
exports.createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};