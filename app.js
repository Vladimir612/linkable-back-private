import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./config/DatabaseConfig.js";
import http from "http";
import { Server } from "socket.io";
import socketHandlers from "./socketHandlers.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Postavi na URL tvoje React aplikacije
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketHandlers(io);

app.use(express.json());
app.use(cors());

app.get("/", (_, res) => {
  res.send("Hello, Lazar!");
});

app.use("/api", apiRoutes);

const port = process.env.PORT || 5000;
server.listen(port, async () => {
  try {
    await connectToDatabase();
    console.log(`Server listening on port: ${port}`);
  } catch (error) {
    console.error("Unsuccessful connection to database", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  await disconnectFromDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  await disconnectFromDatabase();
  process.exit(0);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await disconnectFromDatabase();
  process.exit(1);
});

export default app;
