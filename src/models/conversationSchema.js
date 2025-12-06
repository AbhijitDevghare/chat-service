const mongoose = require('mongoose');

// Conversation: supports 1-1 (default) and optional group chats.
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: String, 
        required: true,
      },
    ],
    // Deterministic key for 1-1 conversations (sorted user ids)
    participantsKey: { type: String },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Ensure only one 1-1 conversation per pair of users
conversationSchema.index(
  { participantsKey: 1 },
  { unique: true, partialFilterExpression: { isGroup: false, participantsKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Conversation', conversationSchema);
