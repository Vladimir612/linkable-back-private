import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  availabilityStatus: {
    type: String,
    enum: ["Up for a call", "Available for messages", "Unavailable"],
    required: true,
  },
  availabilitySchedule: {
    weekdays: {
      type: [
        {
          day: {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            required: true,
          },
          time: {
            start: {
              type: String, // e.g., "09:00"
              required: true,
            },
            end: {
              type: String, // e.g., "17:00"
              required: true,
            },
          },
        },
      ],
      required: true,
    },
    weekend: {
      type: [
        {
          day: {
            type: String,
            enum: ["Saturday", "Sunday"],
            required: true,
          },
          time: {
            start: {
              type: String, // e.g., "10:00"
              required: true,
            },
            end: {
              type: String, // e.g., "14:00"
              required: true,
            },
          },
        },
      ],
      required: true,
    },
  },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "User", "Moderator"],
    required: true,
  },
  profileImage: {
    type: String,
    required: true,
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
    ],
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  experiences: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      answer: {
        type: String,
        required: true,
      },
    },
  ],
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
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
  availability: [
    {
      type: availabilitySchema,
      required: true,
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
