import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referenca na korisnika koji je ostavio komentar
    required: true,
  },
  content: {
    type: String, // Sadržaj komentara
    required: true,
  },
  createdAt: {
    type: Date, // Datum kada je komentar kreiran
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  voters: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      voteType: {
        type: String,
        enum: ["upvote", "downvote"],
        required: true,
      },
    },
  ],
  comments: [
    {
      type: commentSchema,
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

export default Post;
