const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminEmail = 'admin@test.com';
    const adminPassword = 'password123';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      mongoose.connection.close();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      username: 'adminuser',
      email: adminEmail,
      password: hashedPassword,
      fname: 'Admin',
      lname: 'User',
      gender: 'male',
      parentEmail: adminEmail,
      type: 'ADMIN',
      emailVerified: true,
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
  }
};

createAdmin();
