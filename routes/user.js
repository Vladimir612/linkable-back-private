import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../schemas/UserSchema.js";
import dotenv from "dotenv";
import {
  authorize,
  checkOwnershipOrParticipation,
} from "../middlewares/authorize.js";
import {
  cloudinaryStorage,
  deleteImageFromCloudinary,
} from "../config/CloudinaryConfig.js";
import multer from "multer";
import { extractPublicId } from "../helpers/index.js";

dotenv.config();

const router = express.Router();

const uploadProfileImg = multer({
  storage: cloudinaryStorage("profile_images"),
});

router.post(
  "/register",
  uploadProfileImg.single("profileImage"),
  async (req, res) => {
    try {
      const {
        username,
        name,
        surname,
        password,
        age,
        dissabilityType,
        gender,
      } = req.body;

      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(404).send("User already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        password: hashedPassword,
        name,
        surname,
        age,
        dissabilityType,
        gender,
        role: "User",
      });

      if (req.file) {
        newUser.profileImage = req.file.path;
      }

      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, username: newUser.username },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res
        .status(201)
        .json({ message: "User registered successfully", token: token });
    } catch (error) {
      if (req.file && req.file.path) {
        let imgPublicId = extractPublicId(req.file.path);
        await deleteImageFromCloudinary(
          `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${imgPublicId}`
        );
      }
      res.status(500).json({ message: "Error registering user", error });
    }
  }
);

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("User not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send("Invalid password");

    const token = jwt.sign(
      { id: user._id, username: user.username },
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

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
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

      if (req.user.role !== "Admin") {
        if (!checkOwnershipOrParticipation(req, user)) {
          if (req.file && req.file.path) {
            cloudinaryImageId = extractPublicId(req.file.path);
            await deleteImageFromCloudinary(
              `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${cloudinaryImageId}`
            );
          }
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      const {
        username,
        password,
        name,
        surname,
        age,
        dissabilityType,
        gender,
        experiences,
        role,
      } = req.body;

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          if (req.file && req.file.path) {
            cloudinaryImageId = extractPublicId(req.file.path);
            await deleteImageFromCloudinary(
              `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${cloudinaryImageId}`
            );
          }
          return res.status(400).json({ message: "Username already exists" });
        }
        user.username = username;
      }

      if (experiences && experiences.length > 0) {
        const tagsFromChatGPT = await sendToChatGPT(experiences);
        await addTagsToUser(user, tagsFromChatGPT);
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }
      if (name) user.name = name;
      if (surname) user.surname = surname;
      if (age) user.age = age;
      if (dissabilityType) user.dissabilityType = dissabilityType;
      if (gender) user.gender = gender;
      if (experiences) user.experiences = experiences;

      if (req.user.role === "Admin" && role) {
        user.role = role;
      }

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
          `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${imgPublicId}`
        );
      }
      res.status(500).json({ message: "Error updating user", error });
    }
  }
);

router.delete("/:id", authorize(["User", "Admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    // if (req.user.role !== "Admin") {
    //   if (!checkOwnershipOrParticipation(req, user)) {
    //     return res.status(403).json({ message: "Unauthorized" });
    //   }
    // }

    if (user.profileImage) {
      const imgPublicId = extractPublicId(user.profileImage);

      await deleteImageFromCloudinary(
        `${process.env.CLOUDINARY_FOLDER_NAME}/profile_images/${imgPublicId}`
      );
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

export default router;
