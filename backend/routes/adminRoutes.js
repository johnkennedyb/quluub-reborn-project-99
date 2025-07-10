
const express = require('express');
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  updateUser,
  sendPasswordReset,
  sendEmail
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Apply admin auth to all routes
router.use(protect);
router.use(isAdmin);

// Admin dashboard stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/reset-password', sendPasswordReset);
router.post('/users/:id/send-email', sendEmail);

module.exports = router;
