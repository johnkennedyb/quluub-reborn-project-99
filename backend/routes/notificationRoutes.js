const express = require('express');
const {
  getNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;