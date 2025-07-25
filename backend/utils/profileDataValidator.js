const User = require('../models/User');

/**
 * Comprehensive Profile Data Validation and Testing System
 * Ensures all profile fields from frontend are properly saved to backend
 */

class ProfileDataValidator {
  constructor() {
    this.requiredFields = [
      // Basic Info
      'fname', 'lname', 'email', 'username', 'gender', 'dob',
      'kunya', 'maritalStatus', 'noOfChildren', 'summary', 'workEducation',
      
      // Location and Demographics
      'nationality', 'country', 'state', 'city', 'region', 'ethnicity',
      
      // Physical Appearance
      'height', 'weight', 'build', 'appearance', 'hijab', 'beard', 'genotype',
      
      // Islamic Practice and Deen
      'patternOfSalaah', 'revert', 'startedPracticing', 'sect', 
      'scholarsSpeakers', 'dressingCovering', 'islamicPractice',
      
      // Lifestyle and Personality
      'traits', 'interests',
      
      // Matching Preferences
      'openToMatches', 'dealbreakers', 'icebreakers',
      
      // Wali Details (for female users)
      'waliDetails'
    ];

    this.frontendToBackendFieldMapping = {
      // Direct mappings (same field names)
      'fname': 'fname',
      'lname': 'lname',
      'kunya': 'kunya',
      'dob': 'dob',
      'maritalStatus': 'maritalStatus',
      'noOfChildren': 'noOfChildren',
      'summary': 'summary',
      'workEducation': 'workEducation',
      'nationality': 'nationality',
      'country': 'country',
      'state': 'state',
      'city': 'city',
      'region': 'region',
      'height': 'height',
      'weight': 'weight',
      'build': 'build',
      'appearance': 'appearance',
      'hijab': 'hijab',
      'beard': 'beard',
      'genotype': 'genotype',
      'patternOfSalaah': 'patternOfSalaah',
      'revert': 'revert',
      'startedPracticing': 'startedPracticing',
      'sect': 'sect',
      'scholarsSpeakers': 'scholarsSpeakers',
      'dressingCovering': 'dressingCovering',
      'islamicPractice': 'islamicPractice',
      'openToMatches': 'openToMatches',
      'dealbreakers': 'dealbreakers',
      'icebreakers': 'icebreakers',
      'waliDetails': 'waliDetails',
      
      // Array fields (stored as JSON strings)
      'ethnicity': 'ethnicity', // Array field
      'traits': 'traits', // JSON string
      'interests': 'interests' // JSON string
    };
  }

  /**
   * Validate that all profile fields are properly defined in the User model
   */
  async validateUserModelFields() {
    const userSchema = User.schema;
    const schemaFields = Object.keys(userSchema.paths);
    
    const missingFields = [];
    const validationResults = {
      totalFields: this.requiredFields.length,
      validFields: 0,
      missingFields: [],
      extraFields: [],
      fieldTypes: {}
    };

    // Check if all required fields exist in schema
    this.requiredFields.forEach(field => {
      if (schemaFields.includes(field)) {
        validationResults.validFields++;
        validationResults.fieldTypes[field] = userSchema.paths[field].instance;
      } else {
        validationResults.missingFields.push(field);
      }
    });

    // Check for extra fields that might not be needed
    const expectedFields = [...this.requiredFields, '_id', '__v', 'createdAt', 'updatedAt', 'password', 'email', 'username', 'gender', 'plan', 'status', 'type', 'emailVerified', 'hidden', 'parentEmail', 'validationToken', 'validationTokenExpiration', 'resetPasswordToken', 'resetPasswordTokenExpiration', 'referralCode', 'referredBy', 'referralStatus', 'referralStats', 'videoCallCredits', 'premiumExpirationDate', 'lastSeen', 'favorites', 'deviceTokens'];
    
    schemaFields.forEach(field => {
      if (!expectedFields.includes(field) && !field.startsWith('$')) {
        validationResults.extraFields.push(field);
      }
    });

    return validationResults;
  }

  /**
   * Test profile data saving and retrieval end-to-end
   */
  async testProfileDataIntegrity(userId, testData = null) {
    try {
      // Generate comprehensive test data if not provided
      const profileTestData = testData || this.generateTestProfileData();
      
      console.log('🧪 Starting Profile Data Integrity Test...');
      console.log(`📝 Testing ${Object.keys(profileTestData).length} profile fields`);

      // Step 1: Save test data to database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Update user with test data
      Object.keys(profileTestData).forEach(field => {
        if (this.frontendToBackendFieldMapping[field]) {
          user[field] = profileTestData[field];
        }
      });

      await user.save();
      console.log('✅ Test data saved to database');

      // Step 2: Retrieve data from database
      const retrievedUser = await User.findById(userId).lean();
      console.log('✅ Test data retrieved from database');

      // Step 3: Validate data integrity
      const validationResults = this.validateDataIntegrity(profileTestData, retrievedUser);
      
      console.log('\n📊 Profile Data Integrity Test Results:');
      console.log(`✅ Fields Saved Correctly: ${validationResults.correctFields.length}`);
      console.log(`❌ Fields Lost/Corrupted: ${validationResults.incorrectFields.length}`);
      console.log(`⚠️  Fields Not Tested: ${validationResults.notTestedFields.length}`);

      if (validationResults.incorrectFields.length > 0) {
        console.log('\n❌ FAILED FIELDS:');
        validationResults.incorrectFields.forEach(field => {
          console.log(`  - ${field.name}: Expected "${field.expected}", Got "${field.actual}"`);
        });
      }

      if (validationResults.notTestedFields.length > 0) {
        console.log('\n⚠️  NOT TESTED FIELDS:');
        validationResults.notTestedFields.forEach(field => {
          console.log(`  - ${field}`);
        });
      }

      return {
        success: validationResults.incorrectFields.length === 0,
        results: validationResults,
        testData: profileTestData,
        retrievedData: retrievedUser
      };

    } catch (error) {
      console.error('❌ Profile Data Integrity Test Failed:', error);
      return {
        success: false,
        error: error.message,
        results: null
      };
    }
  }

  /**
   * Generate comprehensive test data for all profile fields
   */
  generateTestProfileData() {
    return {
      // Basic Info
      kunya: 'Abu Test',
      dob: new Date('1990-01-01'),
      maritalStatus: 'Single',
      noOfChildren: '0',
      summary: 'Test user profile summary for data integrity validation',
      workEducation: 'Software Engineer at Test Company',
      
      // Location and Demographics
      nationality: 'Test Nationality',
      country: 'Test Country',
      state: 'Test State',
      city: 'Test City',
      region: 'Test Region',
      ethnicity: ['Test Ethnicity 1', 'Test Ethnicity 2'],
      
      // Physical Appearance
      height: '5\'10"',
      weight: '70kg',
      build: 'Average',
      appearance: 'Test appearance description',
      hijab: 'Yes',
      beard: 'Yes',
      genotype: 'AA',
      
      // Islamic Practice and Deen
      patternOfSalaah: '5 times daily',
      revert: 'No',
      startedPracticing: new Date('2010-01-01'),
      sect: 'Sunni',
      scholarsSpeakers: 'Test scholars and speakers',
      dressingCovering: 'Modest Islamic dress',
      islamicPractice: 'Practicing Muslim',
      
      // Lifestyle and Personality (as JSON strings for backend)
      traits: JSON.stringify(['Kind', 'Patient', 'Understanding']),
      interests: JSON.stringify(['Reading', 'Travel', 'Technology']),
      
      // Matching Preferences
      openToMatches: 'Yes, seeking marriage',
      dealbreakers: 'Test dealbreakers',
      icebreakers: 'Test icebreakers',
      
      // Wali Details (as JSON string for backend)
      waliDetails: JSON.stringify({
        name: 'Test Wali',
        email: 'wali@test.com',
        whatsapp: '+1234567890',
        telegram: '@testwali',
        otherNumber: '+0987654321'
      })
    };
  }

  /**
   * Validate data integrity between saved and retrieved data
   */
  validateDataIntegrity(originalData, retrievedData) {
    const results = {
      correctFields: [],
      incorrectFields: [],
      notTestedFields: []
    };

    Object.keys(originalData).forEach(field => {
      const backendField = this.frontendToBackendFieldMapping[field];
      
      if (!backendField) {
        results.notTestedFields.push(field);
        return;
      }

      const originalValue = originalData[field];
      const retrievedValue = retrievedData[backendField];

      // Handle different data types
      let isMatch = false;
      
      if (originalValue instanceof Date && retrievedValue) {
        // Date comparison
        isMatch = new Date(retrievedValue).getTime() === originalValue.getTime();
      } else if (Array.isArray(originalValue) && Array.isArray(retrievedValue)) {
        // Array comparison
        isMatch = JSON.stringify(originalValue.sort()) === JSON.stringify(retrievedValue.sort());
      } else if (typeof originalValue === 'string' && typeof retrievedValue === 'string') {
        // String comparison
        isMatch = originalValue.trim() === retrievedValue.trim();
      } else {
        // General comparison
        isMatch = originalValue === retrievedValue;
      }

      if (isMatch) {
        results.correctFields.push(field);
      } else {
        results.incorrectFields.push({
          name: field,
          expected: originalValue,
          actual: retrievedValue,
          type: typeof originalValue
        });
      }
    });

    return results;
  }

  /**
   * Generate a comprehensive profile data report
   */
  async generateProfileDataReport(userId) {
    try {
      console.log('📋 Generating Comprehensive Profile Data Report...\n');

      // 1. Validate User Model Fields
      console.log('1️⃣ Validating User Model Schema...');
      const modelValidation = await this.validateUserModelFields();
      console.log(`   ✅ Valid Fields: ${modelValidation.validFields}/${modelValidation.totalFields}`);
      if (modelValidation.missingFields.length > 0) {
        console.log(`   ❌ Missing Fields: ${modelValidation.missingFields.join(', ')}`);
      }

      // 2. Test Profile Data Integrity
      console.log('\n2️⃣ Testing Profile Data Integrity...');
      const integrityTest = await this.testProfileDataIntegrity(userId);
      
      // 3. Generate Summary Report
      console.log('\n📊 COMPREHENSIVE PROFILE DATA REPORT');
      console.log('='.repeat(50));
      console.log(`🔍 User ID: ${userId}`);
      console.log(`📅 Test Date: ${new Date().toISOString()}`);
      console.log(`\n📈 Model Validation Results:`);
      console.log(`   - Total Required Fields: ${modelValidation.totalFields}`);
      console.log(`   - Valid Schema Fields: ${modelValidation.validFields}`);
      console.log(`   - Missing Schema Fields: ${modelValidation.missingFields.length}`);
      
      if (integrityTest.success) {
        console.log(`\n✅ Data Integrity Test: PASSED`);
        console.log(`   - Fields Saved Correctly: ${integrityTest.results.correctFields.length}`);
        console.log(`   - Fields Failed: ${integrityTest.results.incorrectFields.length}`);
      } else {
        console.log(`\n❌ Data Integrity Test: FAILED`);
        console.log(`   - Error: ${integrityTest.error || 'Unknown error'}`);
      }

      console.log('\n🎯 OVERALL STATUS: ' + (
        modelValidation.missingFields.length === 0 && integrityTest.success 
          ? '✅ PROFILE DATA SYSTEM FULLY FUNCTIONAL' 
          : '❌ PROFILE DATA SYSTEM NEEDS ATTENTION'
      ));

      return {
        modelValidation,
        integrityTest,
        overallStatus: modelValidation.missingFields.length === 0 && integrityTest.success
      };

    } catch (error) {
      console.error('❌ Failed to generate profile data report:', error);
      return {
        error: error.message,
        overallStatus: false
      };
    }
  }
}

module.exports = ProfileDataValidator;
