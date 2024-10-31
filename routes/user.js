import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../schemas/UserSchema.js";
import dotenv from "dotenv";
import { authorize } from "../middlewares/authorize.js";
import {
  cloudinaryStorage,
  deleteImageFromCloudinary,
} from "../config/CloudinaryConfig.js";
import multer from "multer";
import { extractPublicId } from "../helpers/index.js";
import OpenAI from "openai";
import Comment from "../schemas/CommentSchema.js";

dotenv.config();

const router = express.Router();

const uploadProfileImg = multer({
  storage: cloudinaryStorage("profile_images"),
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

router.post("/register", async (req, res) => {
  try {
    const { email, fullname, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(404).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      fullname,
      role: "User",
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res
      .status(201)
      .json({ message: "User registered successfully", token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user", error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send("Invalid password");

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

router.patch(
  "/:id",
  authorize(["User", "Admin"]),
  uploadProfileImg.single("profileImage"),
  async (req, res) => {
    let cloudinaryImageId = null;

    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).send("User not found");

      const {
        email,
        fullname,
        age,
        dissabilityType,
        gender,
        phoneNumber,
        availabilityStatus,
        tags,
        experience,
        willingToHelp,
      } = req.body;

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          if (req.file && req.file.path) {
            cloudinaryImageId = extractPublicId(req.file.path);
            await deleteImageFromCloudinary(
              `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${cloudinaryImageId}`
            );
          }
          return res.status(400).json({ message: "email already exists" });
        }
        user.email = email;
      }

      if (fullname && fullname !== "") {
        user.fullname = fullname;
      }

      if (age && age !== "") {
        user.age = age;
      }
      if (dissabilityType && dissabilityType !== "") {
        user.dissabilityType = dissabilityType;
      }
      if (gender && gender !== "") {
        user.gender = gender;
      }
      if (experience && experience.length > 0) {
        user.experience = experience;
        const chatGptTags = await generateGptTags(experience);

        if (chatGptTags.length === 0) {
          return res.status(400).json({ message: "Content not good enough." });
        }

        user.chatGptTags = chatGptTags;
      }
      if (phoneNumber && phoneNumber !== "") {
        user.phoneNumber = phoneNumber;
      }

      if (availabilityStatus && availabilityStatus !== "") {
        user.availabilityStatus = availabilityStatus;
      }
      if (typeof willingToHelp !== "undefined") {
        user.willingToHelp = willingToHelp;
        user.availabilityStatus = willingToHelp
          ? "MESSAGE_AVAILABLE"
          : "UNAVAILABLE";
      }

      if (Array.isArray(tags) && tags.length > 0) user.tags = tags;

      if (req.file) {
        if (user.profileImage) {
          const oldImagePublicId = extractPublicId(user.profileImage);
          await deleteImageFromCloudinary(
            `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${oldImagePublicId}`
          );
        }
        user.profileImage = req.file.path;
      }

      await user.save();
      res.json(user);
    } catch (error) {
      if (req.file && req.file.path) {
        cloudinaryImageId = extractPublicId(req.file.path);
        await deleteImageFromCloudinary(
          `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${cloudinaryImageId}`
        );
      }
      res.status(500).json({ message: "Error updating user", error });
      console.log(error);
    }
  }
);

router.get("/", authorize(["User", "Admin"]), async (_, res) => {
  try {
    const users = await User.find()
      .select(
        "fullname profileImage dissabilityType gender availabilityStatus tags"
      )
      .populate("tags", "tagText");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get("/:id", authorize(["User", "Admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-chats -chatGPTChats -chatGptTags -password") // Izostavi polja koja ne želiš da vratiš
      .populate({
        path: "posts", // Popuni podatke o postovima
      })
      .populate("tags", "tagText"); // Popuni tagove korisnika

    if (!user) return res.status(404).send("User not found");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

router.get(
  "/:userId/comments",
  authorize(["User", "Admin"]),
  async (req, res) => {
    try {
      // Pronalazimo sve komentare koje je korisnik ostavio
      const comments = await Comment.find({
        user: req.params.userId, // Filtriramo komentare po korisniku
      }).select("createdAt content"); // Vraćamo samo 'createdAt' i 'content' polja

      res.json(comments); // Vraćamo sve korisnikove komentare
    } catch (error) {
      res.status(500).json({ message: "Error fetching user comments", error });
    }
  }
);

export default router;
