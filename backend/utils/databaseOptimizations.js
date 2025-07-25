const mongoose = require('mongoose');

// Database optimization utilities and indexing strategies
class DatabaseOptimizer {
  constructor() {
    this.indexesCreated = false;
  }

  // Create optimized indexes for better query performance
  async createOptimizedIndexes() {
    if (this.indexesCreated) return;

    try {
      const User = require('../models/User');
      const Relationship = require('../models/Relationship');
      const UserActivityLog = require('../models/UserActivityLog');

      console.log('Creating optimized database indexes...');

      // User model indexes for faster queries
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ username: 1 }, { unique: true });
      await User.collection.createIndex({ lastSeen: -1 }); // For active user queries
      await User.collection.createIndex({ createdAt: -1 }); // For recent user queries
      await User.collection.createIndex({ plan: 1 }); // For premium user queries
      await User.collection.createIndex({ 
        gender: 1, 
        country: 1, 
        nationality: 1 
      }); // Compound index for search filters
      await User.collection.createIndex({ 
        age: 1, 
        height: 1, 
        build: 1 
      }); // Compound index for physical filters
      await User.collection.createIndex({ favorites: 1 }); // For favorites queries

      // Relationship model indexes for faster relationship queries
      await Relationship.collection.createIndex({ 
        follower_user_id: 1, 
        followed_user_id: 1 
      }, { unique: true }); // Prevent duplicate relationships
      await Relationship.collection.createIndex({ follower_user_id: 1, status: 1 });
      await Relationship.collection.createIndex({ followed_user_id: 1, status: 1 });
      await Relationship.collection.createIndex({ status: 1, createdAt: -1 });
      await Relationship.collection.createIndex({ 
        $or: [
          { follower_user_id: 1 },
          { followed_user_id: 1 }
        ]
      }); // For bi-directional relationship queries

      // UserActivityLog indexes for analytics
      await UserActivityLog.collection.createIndex({ user: 1, createdAt: -1 });
      await UserActivityLog.collection.createIndex({ action: 1, createdAt: -1 });
      await UserActivityLog.collection.createIndex({ targetUser: 1, createdAt: -1 });

      this.indexesCreated = true;
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
    }
  }

  // Optimize aggregation pipelines for complex queries
  getOptimizedUserSearchPipeline(filters, currentUserId, limit = 30, skip = 0) {
    const pipeline = [];

    // Match stage with indexes
    const matchStage = {
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
      ...filters
    };
    pipeline.push({ $match: matchStage });

    // Exclude users with existing relationships (optimized)
    pipeline.push({
      $lookup: {
        from: 'relationships',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$follower_user_id', currentUserId] },
                          { $eq: ['$followed_user_id', '$$userId'] }
                        ]
                      },
                      {
                        $and: [
                          { $eq: ['$follower_user_id', '$$userId'] },
                          { $eq: ['$followed_user_id', currentUserId] }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        ],
        as: 'existingRelationship'
      }
    });

    // Filter out users with existing relationships
    pipeline.push({
      $match: {
        existingRelationship: { $size: 0 }
      }
    });

    // Project only necessary fields
    pipeline.push({
      $project: {
        password: 0,
        resetPasswordToken: 0,
        resetPasswordTokenExpiration: 0,
        validationToken: 0,
        email: 0,
        phoneNumber: 0,
        parentEmail: 0,
        waliDetails: 0,
        favorites: 0,
        blockedUsers: 0,
        reportedUsers: 0,
        existingRelationship: 0
      }
    });

    // Sort by last seen (most active first)
    pipeline.push({ $sort: { lastSeen: -1 } });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    return pipeline;
  }

  // Optimized relationship status query
  async getRelationshipStatus(currentUserId, targetUserId) {
    const Relationship = require('../models/Relationship');
    
    const relationships = await Relationship.aggregate([
      {
        $match: {
          $or: [
            { follower_user_id: currentUserId, followed_user_id: targetUserId },
            { follower_user_id: targetUserId, followed_user_id: currentUserId }
          ]
        }
      },
      {
        $project: {
          follower_user_id: 1,
          followed_user_id: 1,
          status: 1,
          id: 1
        }
      }
    ]);

    const status = {
      isMatched: false,
      hasReceivedRequestFrom: false,
      hasSentRequestTo: false,
      relationshipId: null,
      requestId: null
    };

    for (const rel of relationships) {
      if (rel.status === 'matched') {
        status.isMatched = true;
        status.relationshipId = rel.id;
        break;
      } else if (rel.status === 'pending') {
        if (rel.follower_user_id === targetUserId && rel.followed_user_id === currentUserId) {
          status.hasReceivedRequestFrom = true;
          status.requestId = rel.id;
        } else if (rel.follower_user_id === currentUserId && rel.followed_user_id === targetUserId) {
          status.hasSentRequestTo = true;
          status.relationshipId = rel.id;
        }
      }
    }

    return status;
  }

  // Connection pooling optimization
  optimizeConnectionPool() {
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    return options;
  }

  // Memory usage optimization
  enableMemoryOptimizations() {
    // Enable lean queries by default for read operations
    mongoose.set('toJSON', { virtuals: false });
    mongoose.set('toObject', { virtuals: false });
    
    // Disable automatic index creation in production
    if (process.env.NODE_ENV === 'production') {
      mongoose.set('autoIndex', false);
    }
  }

  // Query performance monitoring
  enableQueryMonitoring() {
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        const start = Date.now();
        console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, {
          query: JSON.stringify(query),
          duration: `${Date.now() - start}ms`
        });
      });
    }
  }
}

// Caching layer for frequently accessed data
class CacheLayer {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  get(key) {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

// Initialize optimizations
const dbOptimizer = new DatabaseOptimizer();
const cacheLayer = new CacheLayer();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cacheLayer.cleanup();
}, 5 * 60 * 1000);

module.exports = {
  DatabaseOptimizer,
  CacheLayer,
  dbOptimizer,
  cacheLayer
};
