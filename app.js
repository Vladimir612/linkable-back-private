import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { dbConnectMiddleware } from "./middlewares/dbConnect.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Ensure database is connected before handling any request
app.use(dbConnectMiddleware);

app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.use("/api", apiRoutes);

// Export the app for Vercel to handle
export default app;
