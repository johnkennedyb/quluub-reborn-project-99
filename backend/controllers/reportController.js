const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, type } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!reportedUserId || !reason || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    // Check if user is trying to report themselves
    if (reporterId === reportedUserId) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // Create the report
    const report = new Report({
      reporter: reporterId,
      reportedUser: reportedUserId,
      reason,
      type,
      status: 'pending'
    });

    await report.save();

    // Populate the report with user details
    await report.populate([
      { path: 'reporter', select: 'fname lname username email' },
      { path: 'reportedUser', select: 'fname lname username email' }
    ]);

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const totalReports = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('reporter', 'fname lname username email')
      .populate('reportedUser', 'fname lname username email')
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      reports,
      pagination: {
        total: totalReports,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        hasNextPage: parseInt(page) * parseInt(limit) < totalReports,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }
    report.reviewedAt = new Date();
    report.reviewedBy = req.user.id;

    await report.save();

    await report.populate([
      { path: 'reporter', select: 'fname lname username email' },
      { path: 'reportedUser', select: 'fname lname username email' },
      { path: 'reviewedBy', select: 'fname lname username email' }
    ]);

    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReport,
  getReports,
  updateReportStatus
};
