import connectToDatabase from "../config/DatabaseConfig.js";

export const dbConnectMiddleware = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).send("Internal Server Error");
  }
};
