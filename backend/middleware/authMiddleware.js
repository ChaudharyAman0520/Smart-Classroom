import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Access denied. No authentication token is provided.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new AppError("The user belonging to this authorization key no longer exists.", 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new AppError("Invalid authentication credentials. Please sign in again.", 401));
    } else if (error.name === "TokenExpiredError") {
      next(new AppError("Your authorization credentials have expired. Please login again.", 401));
    } else {
      next(error);
    }
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not hold permissions to execute this operational transaction.", 403));
    }
    next();
  };
};
