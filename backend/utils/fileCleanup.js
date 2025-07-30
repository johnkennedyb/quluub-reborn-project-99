const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Directories to clean up
const CLEANUP_DIRECTORIES = [
  path.join(__dirname, '../uploads/transcripts'),
  path.join(__dirname, '../uploads/recordings')
];

// File age limits (in days)
const FILE_AGE_LIMITS = {
  transcripts: 7,  // Keep chat transcripts for 7 days
  recordings: 30   // Keep video recordings for 30 days
};

/**
 * Clean up old files in a directory
 * @param {string} directory - Directory path to clean
 * @param {number} maxAgeDays - Maximum age in days
 * @param {string} fileType - Type of files being cleaned (for logging)
 */
const cleanupDirectory = (directory, maxAgeDays, fileType) => {
  try {
    if (!fs.existsSync(directory)) {
      console.log(`📁 Directory ${directory} does not exist, skipping cleanup`);
      return;
    }

    const files = fs.readdirSync(directory);
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    let deletedCount = 0;
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(directory, file);
      
      try {
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAgeMs) {
          totalSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old ${fileType}: ${file} (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days old)`);
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file}:`, error.message);
      }
    });

    if (deletedCount > 0) {
      console.log(`✅ Cleanup completed for ${fileType}: ${deletedCount} files deleted, ${(totalSize / 1024 / 1024).toFixed(2)} MB freed`);
    } else {
      console.log(`📋 No old ${fileType} files to clean up`);
    }

  } catch (error) {
    console.error(`❌ Error cleaning up ${fileType} directory:`, error);
  }
};

/**
 * Run cleanup for all directories
 */
const runCleanup = () => {
  console.log('\n🧹 Starting file cleanup process...');
  console.log(`📅 Cleanup started at: ${new Date().toISOString()}`);
  
  // Clean up transcripts
  cleanupDirectory(
    path.join(__dirname, '../uploads/transcripts'),
    FILE_AGE_LIMITS.transcripts,
    'chat transcripts'
  );
  
  // Clean up recordings
  cleanupDirectory(
    path.join(__dirname, '../uploads/recordings'),
    FILE_AGE_LIMITS.recordings,
    'video recordings'
  );
  
  console.log('🧹 File cleanup process completed\n');
};

/**
 * Get cleanup statistics
 */
const getCleanupStats = () => {
  const stats = {
    transcripts: { count: 0, totalSize: 0 },
    recordings: { count: 0, totalSize: 0 }
  };

  try {
    // Count transcript files
    const transcriptsDir = path.join(__dirname, '../uploads/transcripts');
    if (fs.existsSync(transcriptsDir)) {
      const transcriptFiles = fs.readdirSync(transcriptsDir);
      stats.transcripts.count = transcriptFiles.length;
      transcriptFiles.forEach(file => {
        try {
          const filePath = path.join(transcriptsDir, file);
          const fileStats = fs.statSync(filePath);
          stats.transcripts.totalSize += fileStats.size;
        } catch (error) {
          console.error(`Error reading transcript file ${file}:`, error.message);
        }
      });
    }

    // Count recording files
    const recordingsDir = path.join(__dirname, '../uploads/recordings');
    if (fs.existsSync(recordingsDir)) {
      const recordingFiles = fs.readdirSync(recordingsDir);
      stats.recordings.count = recordingFiles.length;
      recordingFiles.forEach(file => {
        try {
          const filePath = path.join(recordingsDir, file);
          const fileStats = fs.statSync(filePath);
          stats.recordings.totalSize += fileStats.size;
        } catch (error) {
          console.error(`Error reading recording file ${file}:`, error.message);
        }
      });
    }

  } catch (error) {
    console.error('Error getting cleanup stats:', error);
  }

  return {
    transcripts: {
      count: stats.transcripts.count,
      totalSizeMB: (stats.transcripts.totalSize / 1024 / 1024).toFixed(2)
    },
    recordings: {
      count: stats.recordings.count,
      totalSizeMB: (stats.recordings.totalSize / 1024 / 1024).toFixed(2)
    }
  };
};

/**
 * Schedule automatic cleanup
 * Runs daily at 2:00 AM
 */
const scheduleCleanup = () => {
  // Run cleanup daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('⏰ Scheduled cleanup triggered');
    runCleanup();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('📅 Automatic file cleanup scheduled (daily at 2:00 AM UTC)');
};

/**
 * Initialize cleanup system
 */
const initializeCleanup = () => {
  console.log('🧹 Initializing file cleanup system...');
  
  // Create directories if they don't exist
  CLEANUP_DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Schedule automatic cleanup
  scheduleCleanup();
  
  // Run initial cleanup
  setTimeout(() => {
    runCleanup();
  }, 5000); // Run after 5 seconds to allow server to start

  console.log('✅ File cleanup system initialized');
};

module.exports = {
  runCleanup,
  getCleanupStats,
  scheduleCleanup,
  initializeCleanup,
  cleanupDirectory,
  FILE_AGE_LIMITS
};
