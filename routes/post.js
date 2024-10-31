import express from "express";
import Post from "../schemas/PostSchema.js";
import dotenv from "dotenv";
import { authorize } from "../middlewares/authorize.js";
import { cloudinaryStorage } from "../config/CloudinaryConfig.js";
import multer from "multer";
import OpenAI from "openai";
import Comment from "../schemas/CommentSchema.js";
import Tag from "../schemas/TagSchema.js";
import User from "../schemas/UserSchema.js";

dotenv.config();

const router = express.Router();

const uploadPostImg = multer({
  storage: cloudinaryStorage("post_images"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate GPT tags
const generateGptTags = async (content) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a tag extractor. You evaluate a large text and extraxt a group of minimum word count tags. In that group there should be 4 to 10 tags depending on a content size you get. You also return response in next format example: tag1, tag2, tag with four words, tag4. If you can't extract tags, return empty string.",
        },
        {
          role: "user",
          content: "Extract tags from this text: " + content,
        },
      ],
    });

    const gptTags = completion.choices[0].message.content
      .split(",")
      .map((tag) => tag.trim());
    return gptTags;
  } catch (error) {
    console.error("Failed to generate GPT tags:", error);
    return [];
  }
};

//create post
router.post(
  "/",
  authorize(["User", "Admin"]),
  uploadPostImg.single("postImage"),
  async (req, res) => {
    try {
      const { title, content, tags } = req.body;
      if (!title || !content) {
        res.status(400).json({ message: "Please provide required fields" });
      }
      const author = req.user._id;

      let image = null;
      if (req.file && req.file.path) {
        image = req.file.path;
      }

      const chatGptTags = await generateGptTags(content);

      if (chatGptTags.length === 0) {
        return res.status(400).json({ message: "Content not good enough." });
      }

      const newPost = new Post({
        title,
        content,
        author,
        image,
        tags,
        chatGptTags,
      });

      await newPost.save();

      const user = await User.findByIdAndUpdate(author, {
        $push: { posts: newPost._id },
      });

      res
        .status(201)
        .json({ message: "Post created successfully", post: newPost });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to create post", error: error.message });
    }
  }
);

//create comment
router.post(
  "/:postId/comment",
  authorize(["User", "Admin"]),
  async (req, res) => {
    try {
      const { content, commentId } = req.body;
      if (!content) {
        return res
          .status(400)
          .json({ message: "You cannot add a comment without content." });
      }

      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found." });
      }

      if (!commentId) {
        const newComment = new Comment({
          user: req.user._id,
          content,
          createdAt: Date.now(),
          subcomments: [],
        });

        post.comments.push(newComment._id);
        await newComment.save();
        await post.save();

        return res.status(201).json({
          message: "Comment added successfully",
          comment: newComment,
        });
      }

      const parentComment = await Comment.findById(commentId);

      if (!parentComment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      const subComment = new Comment({
        user: req.user._id,
        content,
        createdAt: Date.now(),
        subcomments: [],
      });

      await subComment.save();

      parentComment.subcomments.push(subComment);

      await parentComment.save();

      res.status(201).json({
        message: "Subcomment added successfully",
        comment: subComment,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to add comment", error: error.message });
    }
  }
);

router.post("/:postId/vote", authorize(["User", "Admin"]), async (req, res) => {
  try {
    const { voteType } = req.body;
    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type." });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;

    const existingVote = post.voters.find(
      (vote) => vote.user.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        return res.status(400).json({
          message: `You have already ${voteType}d this post.`,
        });
      } else {
        if (voteType === "upvote") {
          post.upvotes += 1;
          post.downvotes -= 1;
        } else {
          post.downvotes += 1;
          post.upvotes -= 1;
        }
        existingVote.voteType = voteType;
        await post.save();
        return res.status(200).json({
          message: `Successfully changed vote to ${voteType}`,
          post,
        });
      }
    } else {
      if (voteType === "upvote") {
        post.upvotes += 1;
      } else {
        post.downvotes += 1;
      }
      post.voters.push({ user: userId, voteType });
      await post.save();

      return res.status(200).json({
        message: `Successfully ${voteType}d the post`,
        post,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to vote", error: error.message });
  }
});

//get all posts
router.get("/", async (req, res) => {
  try {
    const { query } = req.query;

    let posts;

    if (!query) {
      posts = await Post.find()
        .populate({
          path: "author",
          select: "profileImage fullname",
        })
        .populate({
          path: "comments",
          select: "user content createdAt",
          populate: {
            path: "user",
            select: "profileImage",
          },
        })
        .populate({
          path: "tags",
          select: "tagText",
        });
    } else {
      const searchRegex = new RegExp(query, "i");

      // Prvo pronađi tag po tekstu
      const tag = await Tag.findOne({ tagText: { $regex: searchRegex } });

      // Ako tag postoji, koristi njegov _id u pretrazi
      const tagId = tag ? tag._id : null;

      posts = await Post.aggregate([
        {
          $match: {
            $or: [
              { title: { $regex: searchRegex } },
              { tags: { $in: tagId ? [tagId] : [] } },
              { content: { $regex: searchRegex } },
            ],
          },
        },
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            as: "tagDetails",
          },
        },
        {
          $addFields: {
            score: {
              $switch: {
                branches: [
                  {
                    case: {
                      $regexMatch: { input: "$title", regex: searchRegex },
                    },
                    then: 4,
                  },
                  {
                    case: { $in: [tagId, "$tags"] },
                    then: 3,
                  },
                  {
                    case: {
                      $regexMatch: { input: "$content", regex: searchRegex },
                    },
                    then: 2,
                  },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { score: -1 } },
      ]);

      posts = await Post.populate(posts, [
        {
          path: "author",
          select: "profileImage fullname",
        },
        {
          path: "comments",
          select: "user content createdAt",
          populate: {
            path: "user",
            select: "profileImage",
          },
        },
        {
          path: "tags",
          select: "tagText",
        },
      ]);
    }

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve posts", error: error.message });
  }
});

//get details
router.get("/:postId", authorize(["User", "Admin"]), async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId)
      .populate({
        path: "author",
        select: "profileImage fullname",
      })
      .populate({
        path: "comments",
        select: "user content createdAt",
        populate: {
          path: "user",
          select: "profileImage",
        },
      })
      .populate({
        path: "tags",
        select: "tagText",
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error });
  }
});

//get subcomments
router.get(
  "/comments/:commentId/subcomments",
  authorize(["User", "Admin"]),
  async (req, res) => {
    const { commentId } = req.params;

    try {
      const comment = await Comment.findById(commentId).populate({
        path: "subcomments", // Populi subkomentare (koji su ObjectId referenci)
        select: "content createdAt", // Izvuci content i createdAt za svaki subkomentar
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Populiraj user polje za svaki subkomentar
      const populatedSubcomments = await Comment.populate(comment.subcomments, {
        path: "user",
        select: "profileImage", // Populi samo profileImage korisnika
      });

      // Vraćanje popunjenih subkomentara
      res.status(200).json(populatedSubcomments);
    } catch (error) {
      console.error("Error fetching subcomments:", error);
      res.status(500).json({
        message: "Failed to retrieve subcomments",
        error: error.message,
      });
    }
  }
);

export default router;
