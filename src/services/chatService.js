const Conversation = require('../models/conversationSchema');
const Message = require('../models/message');
const axios = require("axios");
const mongoose = require('mongoose');

const userServiceURL = "https://api.impactlog.me/user/profile"

// Utility: build a deterministic participants key (sorted)
function participantsKey(userA, userB) {
  return [String(userA), String(userB)].sort().join(':');
}

async function getOrCreateConversation(userA, userB) {
  if (!userA || !userB) throw new Error('Both participants required');
  const key = participantsKey(userA, userB);

  let convo = await Conversation.findOne({ participantsKey: key });
  if (!convo) {
    convo = await Conversation.create({ participants: [userA, userB], participantsKey: key });
  }
  return convo;
}

async function createConversation(userA, userB) {
  return getOrCreateConversation(userA, userB);
}

async function sendMessage({ senderId, receiverId, text, media, replyTo }) {
  if (!senderId || !receiverId) throw new Error('senderId and receiverId are required');

  const conversation = await getOrCreateConversation(senderId, receiverId);

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId,
    text: text || '',
    media: media || [],
    replyTo: replyTo || undefined,
    seenBy: [senderId],
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  return { conversation, message };
}

async function getChatList(userId, { limit = 50, offset = 0 } = {}) {
  // Find conversations where user participates
  const conversations = await Conversation.find({ participants: userId })
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  // Map to include counterpart id and unread count
  const results = await Promise.all(
    conversations.map(async (c) => {
      const counterpartId = c.participants.find((p) => String(p) !== String(userId));
      const unreadCount = await Message.countDocuments({
        conversationId: c._id,
        senderId: counterpartId,
        seenBy: { $ne: String(userId) },
      });
      return {
        conversationId: c._id,
        participants: c.participants,
        counterpartId,
        lastMessage: c.lastMessage || null,
        unreadCount,
        updatedAt: c.updatedAt,
      };
    })
  );

  // Collect all unique user IDs to fetch from user service
  const userIds = [
    ...new Set(results.flatMap(r => r.participants))
  ];

  // console.log(userIds)
  // Call user service to get user info
  const response = await axios.post(
    `${userServiceURL}/getUsersByUserIds`,
    { userIds } // send the array in body
  );

  const users=response.data.users;


  // Map user info to counterpartId in results
  const usersMap = Object.fromEntries(users.map(u => [String(u.id), u]));
  const finalResults = results.map(r => ({
    ...r,
    counterpartInfo: usersMap[r.counterpartId] || null
  }));


  return finalResults;
}



// function to get the messages

async function getMessages(conversationId, { limit = 50, before } = {}) {
  let query = {};

  // Use ObjectId if possible, otherwise fallback to string
  if (mongoose.Types.ObjectId.isValid(conversationId)) {
    query.conversationId = new mongoose.Types.ObjectId(conversationId);
  } else {
    query.conversationId = conversationId;
  }

  // Filter messages created before a given date
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }


  const items = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return items.reverse(); // return in chronological order
}

async function markAsSeen(conversationId, userId) {
  if (!conversationId || !userId) throw new Error('conversationId and userId required');
  // Mark all messages from others as seen by userId
  await Message.updateMany(
    { conversationId, senderId: { $ne: String(userId) } },
    { $addToSet: { seenBy: String(userId) } }
  );

  const latest = await Message.findOne({ conversationId }).sort({ createdAt: -1 }).lean();
  return { success: true, lastSeenMessageId: latest?._id || null };
}

module.exports = {
  createConversation,
  sendMessage,
  getChatList,
  getMessages,
  markAsSeen,
};
