require("dotenv").config();
const JWT = require("jsonwebtoken");
const AppError = require("../utils/error.utils.js");

const jwtAuth = (req, res, next) => {
  // 1. Try to get token from cookie
  console.log("REQUEST TO CHAT SERVICE JWT AUTH",req.cookies?.token)
  let token = req.cookies?.token;

  // 2. If not in cookie, try Authorization header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts[0] === "Bearer" && parts[1]) {
      token = parts[1];
    }
  }

      // console.log("REQUEST JWT AUTH COMPLETED",token)


  // 3. If still no token → Unauthorized
  if (!token) {
    return next(new AppError("Not Authorized: No token provided", 401));
  }

  try {
    // 4. Verify JWT token
    const payload = JWT.verify(token, process.env.JWT_SECRET);

    // 5. Attach user info to request
    req.user = { id: payload.id, email: payload.email };

    next();
  } catch (error) {
    return next(new AppError(`Not Authorized: ${error.message}`, 401));
  }
};

module.exports = jwtAuth;
