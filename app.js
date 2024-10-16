import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToDatabase from "./config/DatabaseConfig.js";
import apiRoutes from "./routes/index.js";
import http from "http";
dotenv.config();

const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());

app.use(cors());

app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.use("/api", apiRoutes);

const server = http.createServer(app);

server.listen(port, async () => {
  try {
    await connectToDatabase();
    console.log(`Server is listening on port: ${port}`);
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
});
