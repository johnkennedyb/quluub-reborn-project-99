
const express = require('express');
const { 
  getUserProfile, 
  updateUserProfile, 
  getAllUsers, 
  getBrowseUsers, 
  upgradePlan,
  addToFavorites,
  removeFromFavorites,
  getFavorites
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);

// Browse routes
router.get('/users', protect, getAllUsers);
router.get('/browse', protect, getBrowseUsers);

// Payment routes
router.post('/upgrade-plan', upgradePlan);

// Favorites routes
router.post('/favorites/:userId', protect, addToFavorites);
router.delete('/favorites/:userId', protect, removeFromFavorites);
router.get('/favorites', protect, getFavorites);

module.exports = router;
