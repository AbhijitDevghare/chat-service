const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: { type: String, required: true }, // userId from User Service
    receiverId: { type: String, required: true },
    text: { type: String },
    media: [
      {
        url: String,
        type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message', // self-reference
    },
    seenBy: [
      {
        type: String, // userId who has seen the message
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, senderId: 1 });

module.exports = mongoose.model('Message', messageSchema);
