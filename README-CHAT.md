Chat Service Add-on

Overview
- Node.js, Express, MongoDB (Mongoose), Socket.io
- One-to-one messaging using Conversation and Message models

Environment
- MONGO_URI=mongodb://127.0.0.1:27017/chat_service
- JWT_SECRET=replace_me
- PORT=3000

Run
- npm run dev

REST Endpoints (all require JWT in cookie token or Authorization: Bearer TOKEN)
- POST /chat/conversations { participantId }
- GET /chat/chats
- GET /chat/conversations/:conversationId/messages?limit=50&before=ISO
- POST /chat/messages { receiverId, text, media, replyTo }
- POST /chat/messages/seen { conversationId }

Socket Events
- sendMessage -> { receiverId, text, media, replyTo }
  - Emits to sender: messageSent
  - Emits to receiver: receiveMessage
- markAsSeen -> { conversationId }
  - Emits: seenUpdate
- presence broadcast on connect/disconnect

Example Client
- See examples/react-client-snippet.jsx
