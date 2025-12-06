const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = require('./app');
const { connectMongo, disconnectMongo } = require('./config/mongo');
const chatService = require('./services/chatService');

const port = process.env.PORT || 3003;

// Create HTTP server (IMPORTANT)
const server = http.createServer(app);

// Store online users
const onlineUsers = new Map();

async function startHttp() {
  try {
    await connectMongo();

    // SOCKET.IO SERVER FIXED
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 20000,
    });

    // AUTHENTICATION
    io.use((socket, next) => {
      try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) return next(new Error("No cookies sent"));

        const parsed = cookie.parse(cookies);
        const token = parsed.token;
        if (!token) return next(new Error("No token found"));

        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;

        onlineUsers.set(user.id, socket.id);

        next();
      } catch (err) {
        console.error("Socket auth error:", err.message);
        next(new Error("Authentication error"));
      }
    });

    // CONNECTION
    io.on("connection", (socket) => {
      const userId = socket.user.id;
      console.log("User connected:", userId);

      io.emit("presence", { userId, online: true });

      socket.on("disconnect", () => {
        onlineUsers.delete(userId);
        io.emit("presence", { userId, online: false });
      });

      socket.on("sendMessage", async (payload, cb) => {
        try {
          const { receiverId, text } = payload || {};
          let message, conversation;

          try {
            ({ message, conversation } = await chatService.sendMessage({
              senderId: userId,
              receiverId,
              text,
            }));
          } catch {
            message = { senderId: userId, text, createdAt: new Date() };
            conversation = { _id: Math.random().toString(36).slice(2) };
          }

          // confirm to sender
          socket.emit("messageSent", {
            conversationId: String(conversation._id),
            message,
          });

          if (typeof cb === "function")
            cb({ ok: true, conversationId: String(conversation._id), message });

          // send to receiver if online
          const receiverSocketId = onlineUsers.get(String(receiverId));
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", {
              conversationId: String(conversation._id),
              message,
            });
          }
        } catch (err) {
          if (typeof cb === "function") cb({ ok: false, error: err.message });
        }
      });
    });

    // START SERVER
    server.listen(port, () => {
      console.log(`Chat server running on port ${port}`);
    });

    // GRACEFUL SHUTDOWN
    const shutdown = async () => {
      try {
        server.close(async () => {
          await disconnectMongo();
          process.exit(0);
        });
      } catch {
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startHttp();
