import express from "express";

import userRouter from "./user.js";
import postsRouter from "./post.js";
import chatRouter from "./chat.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/post", postsRouter);
router.use("/chat", chatRouter);

export default router;
