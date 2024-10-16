import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  availabilityStatus: {
    type: String,
    enum: ["Up for a call", "Available for messages", "Unavailable"],
  },
  availabilitySchedule: {
    weekdays: {
      type: [
        {
          day: {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          },
          time: {
            start: {
              type: String, // e.g., "09:00"
            },
            end: {
              type: String, // e.g., "17:00"
            },
          },
        },
      ],
    },
    weekend: {
      type: [
        {
          day: {
            type: String,
            enum: ["Saturday", "Sunday"],
          },
          time: {
            start: {
              type: String, // e.g., "10:00"
            },
            end: {
              type: String, // e.g., "14:00"
            },
          },
        },
      ],
    },
  },
});

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
  role: {
    type: String,
    enum: ["Admin", "User", "Moderator"],
    required: true,
  },
  profileImage: {
    type: String,
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
      },
      answer: {
        type: String,
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
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
