require("dotenv").config();
const AppError = require('../utils/error.utils.js');
const {Admin} = require("../models/index.js");
const mongoose = require("mongoose")

const isAdminCheck =async (req, res, next) => {
    try{
        const userId = req.
        user.id;
        const userObj =  await Admin.findOne({ user: new mongoose.Types.ObjectId(userId) });
   
        if(!(userObj.role==="moderator" || userObj.role=="superadmin"))
        {
            return next(new AppError("Not Authorized User",400));
        }

        next();

    }catch(err)
    {
        return next(new AppError(err.message,400));
    }
};

module.exports = isAdminCheck;
