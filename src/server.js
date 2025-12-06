const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const app = require('./app');

const { connectMongo, disconnectMongo } = require('./config/mongo');
const chatService = require('./services/chatService');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { Server } = require("socket.io");

// ---------------- PORT ----------------
const port = process.env.PORT || 3003;

// ---------------- CREATE SERVER ----------------
const server = http.createServer(app);

// Store online users
const onlineUsers = new Map();

async function startHttp() {
  try {
    await connectMongo();

    // ---------------- SOCKET.IO ----------------
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 20000,
    });

    // AUTH MIDDLEWARE (COOKIE JWT)
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
        return next(new Error("Authentication error"));
      }
    });

    // CONNECTION
    io.on("connection", (socket) => {
      const userId = socket.user.id;

      io.emit("presence", { userId, online: true });

      socket.on("disconnect", () => {
        onlineUsers.delete(userId);
        io.emit("presence", { userId, online: false });
      });

      socket.on("sendMessage", async (payload, cb) => {
        try {
          const { receiverId, text } = payload || {};
          let message, conversation;

          ({ message, conversation } = await chatService.sendMessage({
            senderId: userId,
            receiverId,
            text,
          }));

          socket.emit("messageSent", {
            conversationId: String(conversation._id),
            message,
          });

          if (typeof cb === "function")
            cb({ ok: true, conversationId: String(conversation._id), message });

          const receiverSocketId = onlineUsers.get(String(receiverId));
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", {
              conversationId: String(conversation._id),
              message,
            });
          }
        } catch (err) {
          if (cb) cb({ ok: false, error: err.message });
        }
      });
    });

    // ---------------- START SERVER (IMPORTANT FIX) ----------------
    server.listen(port, "0.0.0.0", () => {
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
