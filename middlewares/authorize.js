import jwt from "jsonwebtoken";
import User from "../schemas/UserSchema.js";

import dotenv from "dotenv";

dotenv.config();

const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    try {
      console.log(process.env.JWT_SECRET);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userIdFromToken = decoded.id;
      console.log("1");
      
      const user = await User.findById(userIdFromToken);
      console.log("2");

      if (!user) {
        return res.status(401).json({ error: "Access denied. Invalid token." });
      }
      console.log("3");

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ error: "Access denied. Insufficient permissions." });
      }
      console.log("4");

      req.user = user;
      console.log("5");

      next();
      console.log("6");

    } catch (error) {
      res.status(400).json({ error: "Invalid token." });
    }
  };
};

const checkOwnershipOrParticipation = (req, resource) => {
  const token = req.headers.authorization;

  if (!token) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.id;

    if (resource._id && resource._id.toString() === userIdFromToken) {
      return true;
    }

    if (
      resource.participants &&
      resource.participants.includes(userIdFromToken)
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

export { authorize, checkOwnershipOrParticipation };
