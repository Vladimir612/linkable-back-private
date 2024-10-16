import express from "express";

const router = express.Router();

router.get("/chat", (req, res) => {
  res.send("Chat route is working!");
});

export default router;
