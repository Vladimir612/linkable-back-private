import express from "express";

import userRouter from "./user.js";
import postsRouter from "./post.js";
import openaiRouter from "./openai.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/post", postsRouter);
router.use("/openai", openaiRouter);

export default router;
