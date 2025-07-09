
const User = require('../models/User');
const Report = require('../models/Report');

const createSampleReports = async () => {
  try {
    // Get some sample users
    const users = await User.find().limit(10);
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create sample reports');
      return;
    }

    const sampleReports = [
      {
        reporter: users[0]._id,
        reported: users[1]._id,
        reason: 'fake_profile',
        description: 'This profile appears to be using fake photos and information.',
        status: 'pending'
      },
      {
        reporter: users[1]._id,
        reported: users[2] ? users[2]._id : users[0]._id,
        reason: 'inappropriate_content',
        description: 'User is sharing inappropriate content in messages.',
        status: 'pending'
      },
      {
        reporter: users[0]._id,
        reported: users[3] ? users[3]._id : users[1]._id,
        reason: 'harassment',
        description: 'User is sending harassing messages repeatedly.',
        status: 'dismissed'
      }
    ];

    // Check if reports already exist
    const existingReports = await Report.countDocuments();
    if (existingReports === 0) {
      await Report.insertMany(sampleReports);
      console.log('Sample reports created successfully');
    } else {
      console.log('Sample reports already exist');
    }
  } catch (error) {
    console.error('Error creating sample reports:', error);
  }
};

module.exports = { createSampleReports };
