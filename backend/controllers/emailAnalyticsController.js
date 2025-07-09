
const EmailAnalytics = require('../models/EmailAnalytics');

// @desc    Track email open
// @route   GET /api/email/track/open/:messageId
// @access  Public
exports.trackEmailOpen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    await EmailAnalytics.findOneAndUpdate(
      { messageId },
      {
        status: 'opened',
        openedAt: new Date(),
        'metadata.userAgent': userAgent,
        'metadata.ipAddress': ipAddress
      },
      { upsert: false }
    );

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
    res.send(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    res.status(500).send('Error');
  }
};

// @desc    Track email click
// @route   POST /api/email/track/click/:messageId
// @access  Public
exports.trackEmailClick = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { url } = req.body;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    await EmailAnalytics.findOneAndUpdate(
      { messageId },
      {
        status: 'clicked',
        clickedAt: new Date(),
        'metadata.userAgent': userAgent,
        'metadata.ipAddress': ipAddress,
        $push: { 'metadata.clickedLinks': url }
      },
      { upsert: false }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking email click:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Handle email bounce webhook
// @route   POST /api/email/webhook/bounce
// @access  Public
exports.handleEmailBounce = async (req, res) => {
  try {
    const { messageId, bounceType, bounceReason, recipientEmail } = req.body;

    await EmailAnalytics.findOneAndUpdate(
      { messageId },
      {
        status: 'bounced',
        bounceType,
        bounceReason,
        bouncedAt: new Date()
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Email bounced: ${recipientEmail} - ${bounceReason}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling email bounce:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get email analytics
// @route   GET /api/email/analytics
// @access  Private (Admin)
exports.getEmailAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await EmailAnalytics.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Calculate summary stats
    const totalEmails = analytics.length;
    const opened = analytics.filter(a => a.status === 'opened').length;
    const clicked = analytics.filter(a => a.status === 'clicked').length;
    const bounced = analytics.filter(a => a.status === 'bounced').length;
    const delivered = analytics.filter(a => a.status === 'delivered').length;

    const stats = {
      totalEmails,
      deliveryRate: totalEmails > 0 ? ((delivered / totalEmails) * 100).toFixed(2) : 0,
      openRate: totalEmails > 0 ? ((opened / totalEmails) * 100).toFixed(2) : 0,
      clickRate: totalEmails > 0 ? ((clicked / totalEmails) * 100).toFixed(2) : 0,
      bounceRate: totalEmails > 0 ? ((bounced / totalEmails) * 100).toFixed(2) : 0
    };

    res.json({
      analytics,
      stats
    });
  } catch (error) {
    console.error('Error getting email analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
