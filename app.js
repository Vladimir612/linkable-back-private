import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { dbConnectMiddleware } from "./middlewares/dbConnect.js";
import connectToDatabase from "./config/DatabaseConfig.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Ensure database is connected before handling any request
// app.use(dbConnectMiddleware);

app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.use("/api", apiRoutes);

const port = process.env.PORT || 5000;
app.listen(port, async () => {
  try {
    await connectToDatabase();
    console.log(`Server sluša na portu: ${port}`);
  } catch (error) {
    console.error("Neuspješno povezivanje s bazom podataka", error);
    process.exit(1);
  }
});

// Export the app for Vercel to handle
export default app;
