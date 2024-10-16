import express from "express";

const router = express.Router();

router.post("/post", (req, res) => {
  const { title, content } = req.body;
  // Add your logic to handle the post request here
  res
    .status(201)
    .json({ message: "Post created successfully", post: { title, content } });
});

export default router;
