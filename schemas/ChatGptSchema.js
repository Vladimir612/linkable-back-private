import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "chatgpt"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatgptChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  flag: {
    type: String,
    enum: ["USERS", "POSTS", "AI"],
    required: true,
  },
  messages: [messageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const ChatGPTChat = mongoose.model("ChatGPTChat", chatgptChatSchema);
export default ChatGPTChat;
