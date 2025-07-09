const { v4: uuidv4 } = require("uuid");
const Chat = require('../models/Chat');
const User = require('../models/User');
const Relationship = require('../models/Relationship');
const WaliChat = require('../models/WaliChat');
const { sendWaliViewChatEmail, sendContactWaliEmail } = require('../utils/emailService');

// Helper functions
const plans = {
  freemium: {
    messageAllowance: 10,
    wordCountPerMessage: 20
  },
  premium: {
    messageAllowance: 50,
    wordCountPerMessage: 100,
    videoCall: true
  }
};

const findUser = async (userId) => {
  return await User.findById(userId);
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Helper function to check if two users are matched
const areUsersMatched = async (userId1, userId2) => {
  const relationship = await Relationship.findOne({
    $or: [
      { follower_user_id: userId1, followed_user_id: userId2, status: 'matched' },
      { follower_user_id: userId2, followed_user_id: userId1, status: 'matched' }
    ]
  });
  return !!relationship;
};

// Helper function to send chat report to parents
const sendChatReportToParents = async (userId1, userId2) => {
  try {
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2)
    ]);

    if (!user1 || !user2) return;

    // This link should ideally lead to a page where the guardian can view the chat
    const chatLink = `${process.env.FRONTEND_URL}/wali/chat-view?user1=${userId1}&user2=${userId2}`;

    // Send to user1's parent if they have parentEmail
    if (user1.parentEmail && user1.parentEmail !== user1.email) {
      await sendWaliViewChatEmail(user1.parentEmail, "Guardian", user1.fname, user2.fname, chatLink);
    }

    // Send to user2's parent if they have parentEmail
    if (user2.parentEmail && user2.parentEmail !== user2.email) {
      await sendWaliViewChatEmail(user2.parentEmail, "Guardian", user2.fname, user1.fname, chatLink);
    }

    // Send to wali if user is female and has wali details
    if (user1.gender === 'female' && user1.waliDetails) {
      try {
        const waliDetails = JSON.parse(user1.waliDetails);
        if (waliDetails.email) {
          await sendWaliViewChatEmail(waliDetails.email, waliDetails.name || 'Wali', user1.fname, user2.fname, chatLink);
        }
      } catch (e) {
        console.error('Error parsing wali details for user1:', e);
      }
    }

    if (user2.gender === 'female' && user2.waliDetails) {
      try {
        const waliDetails = JSON.parse(user2.waliDetails);
        if (waliDetails.email) {
          await sendWaliViewChatEmail(waliDetails.email, waliDetails.name || 'Wali', user2.fname, user1.fname, chatLink);
        }
      } catch (e) {
        console.error('Error parsing wali details for user2:', e);
      }
    }

    console.log(`Chat report sent to parents/wali for match between ${user1.fname} and ${user2.fname}`);
  } catch (error) {
    console.error('Error sending chat report to parents:', error);
  }
};

// GET CHAT BETWEEN TWO USERS
const getChat = async (req, res) => {
  const userInfo = req.user;
  const { userId } = req.query;

  try {
    // Check if users are matched before allowing to see messages
    const isMatched = await areUsersMatched(userInfo._id.toString(), userId);
    if (!isMatched) {
      return res.status(403).json({ message: 'You can only chat with matched connections' });
    }

    const contactUser = await findUser(userId);
    const currentUser = await findUser(userInfo._id);

    const chats = await Chat.find({
      $or: [
        { senderId: userInfo._id, receiverId: userId },
        { senderId: userId, receiverId: userInfo._id },
      ],
    }).sort("created");

    const returnData = chats.map((item) => ({
      sender: item.senderId.equals(userInfo._id)
        ? currentUser.username
        : contactUser.username,
      receiver: item.receiverId.equals(userInfo._id)
        ? currentUser.username
        : contactUser.username,
      message: item.message,
      timestamp: item.created,
      id: item._id,
      status: item.status,
    }));

    return res.json(returnData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET ALL RECEIVED CHATS
const getAllChatReceived = async (req, res) => {
  const userInfo = req.user;
  
  try {
    const currentUser = await findUser(userInfo._id);
    const chats = await Chat.find({ receiverId: userInfo._id }).sort("created");

    const returnData = await Promise.all(
      chats.map(async (item) => {
        const sender = await findUser(item.senderId);
        return {
          sender: sender.username,
          receiver: currentUser.username,
          message: item.message,
          timestamp: item.created,
          id: item._id,
          status: item.status,
        };
      })
    );

    return res.json(returnData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET CONVERSATIONS
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all chats where user is sender or receiver
    const chats = await Chat.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { created: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          "userDetails.username": 1,
          "userDetails.fname": 1,
          "userDetails.lname": 1,
          "userDetails.gender": 1,
          "userDetails.country": 1,
          "userDetails.profile_pic": 1,
          unreadCount: {
            $cond: [
              {
                $and: [
                  { $eq: ["$lastMessage.receiverId", userId] },
                  { $eq: ["$lastMessage.status", "UNREAD"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    ]);
    
    // Filter conversations to only include matched users
    const matchedConversations = [];
    for (const chat of chats) {
      const isMatched = await areUsersMatched(userId.toString(), chat._id.toString());
      if (isMatched) {
        matchedConversations.push(chat);
      }
    }
    
    res.json(matchedConversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET MESSAGES
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    
    // Check if users are matched before allowing to see messages
    const isMatched = await areUsersMatched(currentUserId.toString(), otherUserId);
    if (!isMatched) {
      return res.status(403).json({ message: 'You can only chat with matched connections' });
    }
    
    // Get messages between the two users
    const messages = await Chat.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ created: 1 });
    
    // Mark unread messages as read
    await Chat.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        status: "UNREAD"
      },
      {
        $set: { status: "READ" }
      }
    );
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// COUNT SENT MESSAGES FOR VALIDATION
const getChatCountForValidation = async (userId, userInfo) => {
  const count = await Chat.countDocuments({
    senderId: userInfo._id,
    receiverId: userId,
  });
  return count;
};

// ADD CHAT / SEND MESSAGE
const addChat = async (req, res) => {
  const userInfo = req.user;
  const { userId, message } = req.body;
  
  try {
    // Check if users are matched before allowing to send messages
    const isMatched = await areUsersMatched(userInfo._id.toString(), userId);
    if (!isMatched) {
      return res.status(403).json({ message: 'You can only message matched connections' });
    }

    const contact = await findUser(userId);
    const currentUser = await findUser(userInfo._id);

    const {
      messageAllowance,
      wordCountPerMessage,
    } = plans?.[currentUser.plan] || plans.freemium;

    const sentCount = await getChatCountForValidation(contact._id, userInfo);

    if (
      sentCount >= messageAllowance ||
      message.split(" ").length >= wordCountPerMessage
    ) {
      return res.status(422).json({ msg: `plan exceeded` });
    }

    if (currentUser.gender === "female") {
      if (!currentUser.waliDetails) {
        return res.status(422).json({ msg: `wali details required to chat` });
      }

      const waliEmail = JSON.parse(currentUser.waliDetails)?.email;
      if (!waliEmail) {
        return res.status(422).json({ msg: `wali email required to chat` });
      }
    }

    const chat = new Chat({
      senderId: userInfo._id,
      receiverId: contact._id,
      message: message,
      status: "UNREAD"
    });
    await chat.save();

    // Send chat report to parents after every 5th message in the conversation
    const totalMessages = await Chat.countDocuments({
      $or: [
        { senderId: userInfo._id, receiverId: contact._id },
        { senderId: contact._id, receiverId: userInfo._id }
      ]
    });

    if (totalMessages % 5 === 0) {
      // Send chat report every 5 messages
      await sendChatReportToParents(userInfo._id, contact._id);
    }

    return res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE CHAT STATUS
const updateChat = async (req, res) => {
  const { ids } = req.body;

  try {
    if (!Array.isArray(ids) || ids.length < 1) {
      return res.json("Empty list");
    }

    await Chat.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "READ" } }
    );

    return res.json("Updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET UNREAD COUNT
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Count unread messages from matched users only
    const unreadChats = await Chat.find({
      receiverId: userId,
      status: "UNREAD"
    }).populate('senderId', '_id');
    
    let matchedUnreadCount = 0;
    for (const chat of unreadChats) {
      const isMatched = await areUsersMatched(userId.toString(), chat.senderId._id.toString());
      if (isMatched) {
        matchedUnreadCount++;
      }
    }
    
    res.json({ unreadCount: matchedUnreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SEND MESSAGE (for API compatibility)
const sendMessage = addChat;

const contactWali = async (req, res) => {
  const { userId } = req.body; // The user whose wali is being contacted
  const currentUser = req.user; // The user initiating the contact

  try {
    const contactedUser = await User.findById(userId);

    if (!contactedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (contactedUser.gender !== 'female' || !contactedUser.waliDetails) {
      return res.status(400).json({ message: 'This user does not have wali details available for contact.' });
    }

    let waliDetails;
    try {
      waliDetails = JSON.parse(contactedUser.waliDetails);
    } catch (e) {
      console.error('Error parsing wali details for contacted user:', e);
      return res.status(500).json({ message: 'Error processing wali details.' });
    }

    if (!waliDetails.email) {
      return res.status(400).json({ message: 'Wali email is not available.' });
    }

    // Create a record of the contact attempt
    const waliChat = new WaliChat({
      userId: contactedUser._id,
      waliEmail: waliDetails.email,
      contactedBy: currentUser._id,
      message: `User ${currentUser.fname} (${currentUser._id}) initiated contact with the wali of ${contactedUser.fname} (${contactedUser._id}).`
    });
    await waliChat.save();

    // Send email notification to the wali
    await sendContactWaliEmail(waliDetails.email, currentUser.fname);

    res.status(200).json({ message: 'Wali has been contacted successfully.' });

  } catch (error) {
    console.error('Error in contactWali controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// INITIATE VIDEO CALL
const initiateVideoCall = async (req, res) => {
  const userInfo = req.user;
  const { userId } = req.body; // The user to call

  try {
    const currentUser = await findUser(userInfo._id);
    const plan = plans[currentUser.plan] || plans.freemium;

    // 1. Check if user's plan allows video calls
    if (!plan.videoCall) {
      return res.status(403).json({ message: 'Upgrade to premium to use video calls.' });
    }

    // 2. Check if users are matched
    const isMatched = await areUsersMatched(userInfo._id.toString(), userId);
    if (!isMatched) {
      return res.status(403).json({ message: 'You can only call matched connections.' });
    }

    // 3. (Optional) Check for video call credits if you implement a credit system
    // For now, we just check the plan.

    // 4. Generate a unique room name for the video call
    const roomName = uuidv4();

    // In a real application, you would integrate with a service like Twilio or Agora here
    // and return a token for the user to join the video call room.
    console.log(`Video call initiated by ${currentUser.username} with user ${userId} in room ${roomName}`);

    res.status(200).json({ message: 'Video call initiated successfully.', roomName });

  } catch (error) {
    console.error('Error initiating video call:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getChat,
  getAllChatReceived,
  getConversations,
  getMessages,
  addChat,
  updateChat,
  getUnreadCount,
  contactWali,
  initiateVideoCall,
  sendMessage
};
