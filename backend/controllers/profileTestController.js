const ProfileDataValidator = require('../utils/profileDataValidator');
const User = require('../models/User');

/**
 * Profile Data Testing Controller
 * Provides endpoints to test and validate profile data integrity
 */

// @desc    Test profile data integrity for current user
// @route   POST /api/test/profile-integrity
// @access  Private
exports.testProfileIntegrity = async (req, res) => {
  try {
    const userId = req.user._id;
    const validator = new ProfileDataValidator();
    
    // Run comprehensive profile data test
    const report = await validator.generateProfileDataReport(userId);
    
    res.json({
      success: report.overallStatus,
      message: report.overallStatus 
        ? 'Profile data system is fully functional' 
        : 'Profile data system needs attention',
      report: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Profile integrity test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to run profile integrity test',
      error: error.message 
    });
  }
};

// @desc    Validate User model schema fields
// @route   GET /api/test/profile-schema
// @access  Private
exports.validateProfileSchema = async (req, res) => {
  try {
    const validator = new ProfileDataValidator();
    const validation = await validator.validateUserModelFields();
    
    res.json({
      success: validation.missingFields.length === 0,
      message: validation.missingFields.length === 0 
        ? 'All profile fields are properly defined in User model'
        : `${validation.missingFields.length} profile fields are missing from User model`,
      validation: validation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Profile schema validation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to validate profile schema',
      error: error.message 
    });
  }
};

// @desc    Test profile data saving with sample data
// @route   POST /api/test/profile-save
// @access  Private
exports.testProfileSave = async (req, res) => {
  try {
    const userId = req.user._id;
    const validator = new ProfileDataValidator();
    
    // Test with provided data or generate sample data
    const testData = req.body.testData || null;
    const result = await validator.testProfileDataIntegrity(userId, testData);
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Profile data saving and retrieval working correctly'
        : 'Profile data saving or retrieval has issues',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Profile save test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to test profile save functionality',
      error: error.message 
    });
  }
};

// @desc    Get current user's complete profile data
// @route   GET /api/test/profile-complete
// @access  Private
exports.getCompleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get complete user profile with all fields
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken')
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Analyze which fields have data
    const validator = new ProfileDataValidator();
    const fieldAnalysis = {
      totalFields: 0,
      populatedFields: 0,
      emptyFields: 0,
      fieldStatus: {}
    };
    
    Object.keys(validator.frontendToBackendFieldMapping).forEach(field => {
      const backendField = validator.frontendToBackendFieldMapping[field];
      const value = user[backendField];
      
      fieldAnalysis.totalFields++;
      
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        fieldAnalysis.populatedFields++;
        fieldAnalysis.fieldStatus[field] = {
          status: 'populated',
          value: value,
          type: typeof value
        };
      } else {
        fieldAnalysis.emptyFields++;
        fieldAnalysis.fieldStatus[field] = {
          status: 'empty',
          value: value,
          type: typeof value
        };
      }
    });
    
    res.json({
      success: true,
      message: 'Complete profile data retrieved successfully',
      user: user,
      analysis: fieldAnalysis,
      completionPercentage: Math.round((fieldAnalysis.populatedFields / fieldAnalysis.totalFields) * 100),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get complete profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get complete profile data',
      error: error.message 
    });
  }
};

// @desc    Reset profile data to test defaults (for testing only)
// @route   POST /api/test/profile-reset
// @access  Private
exports.resetProfileForTesting = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Profile reset is not allowed in production environment'
      });
    }
    
    const validator = new ProfileDataValidator();
    const testData = validator.generateTestProfileData();
    
    // Update user with test data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Apply test data to user
    Object.keys(testData).forEach(field => {
      if (validator.frontendToBackendFieldMapping[field]) {
        user[field] = testData[field];
      }
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile reset with test data successfully',
      testData: testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Profile reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset profile data',
      error: error.message 
    });
  }
};

// Functions are already exported using exports.functionName above
