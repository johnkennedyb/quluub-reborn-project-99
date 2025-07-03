
const express = require('express');
const {
  initiateCall,
  updateCallStatus,
} = require('../controllers/videoCallController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.post('/initiate', initiateCall);
router.put('/status', updateCallStatus);

module.exports = router;
