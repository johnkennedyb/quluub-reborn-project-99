const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const axios = require('axios');
const crypto = require('crypto');

// Regular signup
const signup = async (req, res) => {
  try {
    const { username, email, password, fname, lname, gender, parentEmail } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fname,
      lname,
      gender,
      parentEmail: parentEmail || email, // Use parentEmail if provided, otherwise use user email
      type: 'USER'
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        gender: user.gender,
        parentEmail: user.parentEmail,
        type: user.type,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          gender: user.gender,
          parentEmail: user.parentEmail,
          type: user.type
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Admin signup
const adminSignup = async (req, res) => {
  try {
    const { username, email, password, fname, lname, adminKey } = req.body;

    // Verify admin key (you should set this in your environment variables)
    const ADMIN_SIGNUP_KEY = process.env.ADMIN_SIGNUP_KEY || 'admin123';
    if (adminKey !== ADMIN_SIGNUP_KEY) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password for admin too
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const user = await User.create({
      username,
      email,
      password: hashedPassword, // Now properly hashed
      fname,
      lname,
      gender: 'other', // Default for admin
      parentEmail: email, // Use admin email as parent email
      type: 'ADMIN',
      status: 'active' // Admin accounts are active by default
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        type: user.type,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          type: user.type
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error during admin signup' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (user && user.type === 'ADMIN') {
      console.log("🔐 Admin login attempt:");
      console.log("Username/Email:", username);
      console.log("User found:", !!user);
      console.log("User type:", user.type);
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      
      console.log(`✅ Login successful for: ${username} (Type: ${user.type})`);
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        gender: user.gender,
        type: user.type,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          gender: user.gender,
          type: user.type
        }
      });
    } else {
      console.log(`❌ Login failed for: ${username}`);
      if (user) {
        console.log("Password comparison failed");
      } else {
        console.log("User not found");
      }
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google OAuth handler
exports.googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Google OAuth: Received authorization code');

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '138477569455-9r9mqdm2csj45us9narl9qojl6fl3t8h.apps.googleusercontent.com',
        client_secret: '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',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.CLIENT_URL || 'http://localhost:8080'}/auth/google/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Google OAuth: Token exchange response received');

    if (!tokenResponse.ok) {
      console.error('Google OAuth: Token exchange failed:', tokenData);
      return res.status(400).json({ message: 'Failed to exchange authorization code' });
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    console.log('Google OAuth: User info received:', { email: googleUser.email, name: googleUser.name });

    if (!userResponse.ok) {
      console.error('Google OAuth: Failed to get user info:', googleUser);
      return res.status(400).json({ message: 'Failed to get user information from Google' });
    }

    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // Update existing user
      user.lastSeen = new Date();
      if (!user.googleId) {
        user.googleId = googleUser.id;
      }
      await user.save();
      console.log('Google OAuth: Existing user signed in:', user.email);
    } else {
      // Create new user
      const username = googleUser.email.split('@')[0] + Math.random().toString(36).substr(2, 4);
      
      user = new User({
        fname: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
        lname: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
        email: googleUser.email,
        username,
        googleId: googleUser.id,
        password: crypto.randomBytes(32).toString('hex'), // Random password for Google users
        isEmailVerified: googleUser.verified_email || true,
        status: 'active',
        plan: 'freemium',
        lastSeen: new Date()
      });

      await user.save();
      console.log('Google OAuth: New user created:', user.email);
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        username: user.username,
        plan: user.plan,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  adminSignup,
  login,
  googleAuth,
  getUserProfile,
  getAllUsers,
  changePassword
};
