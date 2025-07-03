
const express = require('express');
const {
  initiateCall,
  updateCallStatus,
  getCallByRoom,
} = require('../controllers/videoCallController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.post('/initiate', initiateCall);
router.put('/status', updateCallStatus);
router.get('/room/:roomId', getCallByRoom);

module.exports = router;
