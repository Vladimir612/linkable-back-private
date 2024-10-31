import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["Admin", "User", "Moderator"],
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  dissabilityType: {
    type: String,
    enum: [
      "physical",
      "sensory",
      "intellectual",
      "mental",
      "multiple",
      "deaf",
      "blind",
      "mute",
      "cantsay",
    ],
    default: "cantsay",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other",
  },
  availabilityStatus: {
    type: String,
    enum: ["AVAILABLE", "CALL_AVAILABLE", "MESSAGE_AVAILABLE", "UNAVAILABLE"],
    default: "UNAVAILABLE",
  },
  chatGptTags: [
    {
      type: String,
    },
  ],
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  experience: {
    type: String,
    default: "",
  },
  willingToHelp: {
    type: Boolean,
    default: false,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
  ],
  chatGPTChats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatGPTChat",
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
