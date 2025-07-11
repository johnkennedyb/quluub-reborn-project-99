const cron = require('node-cron');
const User = require('../models/User');
const ScheduledEmail = require('../models/ScheduledEmail');
const Relationship = require('../models/Relationship');
const UserActivityLog = require('../models/UserActivityLog');
const {
  sendBulkEmail: sendBulkEmailService,
  sendProfileViewEmail,
  sendPendingRequestsEmail,
  sendEncourageUnhideEmail,
  sendSuggestedAccountsEmail
} = require('./emailService');

const startScheduler = () => {
  console.log('Email scheduler started with all jobs.');

  // 1. Admin-scheduled bulk emails (runs every minute)
  cron.schedule('* * * * *', async () => {
    // console.log('Checking for admin-scheduled emails...');
    const now = new Date();

    try {
      const emailsToSend = await ScheduledEmail.find({
        status: 'pending',
        sendAt: { $lte: now },
      });

      if (emailsToSend.length === 0) {
        // console.log('No scheduled emails to send at this time.');
        return;
      }

      console.log(`Found ${emailsToSend.length} admin-scheduled email(s) to send.`);

      for (const email of emailsToSend) {
        try {
          let recipients = [];
          if (email.sendToAll) {
            recipients = await User.find({});
          } else {
            recipients = await User.find({ '_id': { $in: email.recipients } });
          }

          if (recipients.length > 0) {
            await sendBulkEmailService(recipients, email.subject, email.message, email.attachments);
          }

          email.status = 'sent';
          await email.save();
          console.log(`Successfully sent scheduled email: ${email.subject}`);
        } catch (error) {
          console.error(`Failed to send scheduled email: ${email.subject}`, error);
          email.status = 'failed';
          email.error = error.message;
          email.lastAttempt = new Date();
          await email.save();
        }
      }
    } catch (error) {
      console.error('Error fetching admin-scheduled emails:', error);
    }
  });

  // 2. Weekly Profile View Summary (runs every Sunday at 7 PM)
  cron.schedule('0 19 * * 0', async () => {
    console.log('Running weekly profile view summary job...');
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentViews = await UserActivityLog.aggregate([
        { $match: { action: 'PROFILE_VIEW', createdAt: { $gte: oneWeekAgo } } },
        { $group: { _id: '$receiverId', viewCount: { $sum: 1 } } }
      ]);

      for (const view of recentViews) {
        const user = await User.findById(view._id);
        if (user && user.email && user.settings.emailNotifications) {
          sendProfileViewEmail(user.email, user.fname, view.viewCount);
        }
      }
    } catch (error) {
      console.error('Error in weekly profile view job:', error);
    }
  });

  // 3. Pending Connection Requests Reminder (runs every 3 days at 10 AM)
  cron.schedule('0 10 */3 * *', async () => {
    console.log('Running pending connection requests reminder job...');
    try {
      const pendingRequests = await Relationship.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$followed_user_id', requestCount: { $sum: 1 } } }
      ]);

      for (const request of pendingRequests) {
        const user = await User.findById(request._id);
        if (user && user.email && user.settings.emailNotifications) {
          sendPendingRequestsEmail(user.email, user.fname, request.requestCount);
        }
      }
    } catch (error) {
      console.error('Error in pending requests reminder job:', error);
    }
  });

  // 4. Suggested Matches (runs every Friday at 3 PM)
  cron.schedule('0 15 * * 5', async () => {
    console.log('Running suggested matches email job...');
    try {
      const users = await User.find({ 'settings.emailNotifications': true, 'settings.showSuggestions': true });

      for (const user of users) {
        const existingConnections = await Relationship.find({ $or: [{ follower_user_id: user._id }, { followed_user_id: user._id }] }).select('follower_user_id followed_user_id');
        const connectedUserIds = existingConnections.map(rel => (rel.follower_user_id.toString() === user._id.toString() ? rel.followed_user_id : rel.follower_user_id));
        connectedUserIds.push(user._id); // Exclude self

        const suggestions = await User.find({
          _id: { $nin: connectedUserIds },
          gender: user.gender === 'male' ? 'female' : 'male',
          country: user.country,
          'settings.profileVisibility': 'visible'
        }).limit(5);

        if (suggestions.length > 0) {
          sendSuggestedAccountsEmail(user.email, user.fname, suggestions);
        }
      }
    } catch (error) {
      console.error('Error in suggested matches job:', error);
    }
  });

  // 5. Encourage Unhiding Profile (runs every Monday at 11 AM)
  cron.schedule('0 11 * * 1', async () => {
    console.log('Running encourage unhide profile job...');
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const hiddenUsers = await User.find({
        'settings.profileVisibility': 'hidden',
        'settings.profileVisibilityChangedAt': { $lte: oneWeekAgo },
        'settings.emailNotifications': true
      });

      for (const user of hiddenUsers) {
        sendEncourageUnhideEmail(user.email, user.fname);
      }
    } catch (error) {
      console.error('Error in encourage unhide profile job:', error);
    }
  });
};

module.exports = { startScheduler };
