const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL,   // https://impactlog.me
  credentials: true,
}));

app.use(morgan('dev'));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.set('trust proxy', 1);

// ---------------- ROUTES ----------------
const routes = require('./routes/v1/index');

// IMPORTANT:
// We mount the route with /chat so route inside router is /chats NOT /chat/chats
app.use('/chat', routes);

// SIMPLE TEST
app.get('/testchat', (req, res) => res.send("CHAT OK"));

const errorMiddleware = require('./middleware/error.middleware');
app.use(errorMiddleware);

module.exports = app;
