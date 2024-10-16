import jwt from "jsonwebtoken";
import User from "../schemas/UserSchema.js";

const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userIdFromToken = decoded.id;

      const user = await User.findById(userIdFromToken);

      if (!user) {
        return res.status(401).json({ error: "Access denied. Invalid token." });
      }

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ error: "Access denied. Insufficient permissions." });
      }

      req.user = user;
      next();
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
