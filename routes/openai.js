import express from "express";
import User from "../schemas/UserSchema.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import { authorize } from "../middlewares/authorize.js";
const router = express.Router();

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getUsersWithMatchingExperience = async (
  userInput,
  userDisabilityType,
  userId
) => {
  try {
    const users = await User.find().select(
      "_id fullname availabilityStatus profileImage experience chatGptTags dissabilityType"
    );

    const availableUsers = users.filter(
      (user) => user.availabilityStatus !== "UNAVAILABLE"
    );

    const usersData = availableUsers
      .map(
        (user) =>
          `ID: ${user._id}, Experience: ${
            user.experience
          }, Tags: ${user.chatGptTags.join(", ")}, Disability Type: ${
            user.dissabilityType
          }, Status: ${user.availabilityStatus}`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a matchmaker for finding people with specific experience based on the input. You will receive a userInput and his disability type which you will use to go through a list of users with their _id, experience, tags, disability type, and availability status.
              Sort users primarily based on the closest match in experience to the input. If multiple users have similar experience, put those users that have the same disability type as the user at the beginning of the array.
              Return only users who have relevant experience that matches the input. If no users match the experience, it's okay to return nothing. Exclude users whose experience does not align with the input.
              Return the sorted list of user IDs in the format: id1, id2, id3. If you don't have any user IDs to return, return an empty string. You only have 2 formats to return: a list of user IDs or an empty string! That is very important.`,
        },
        {
          role: "user",
          content: `Here is the user's input: "${userInput}". The user has the disability type: "${userDisabilityType}". Find matching users from the following list:\n${usersData}`,
        },
      ],
    });

    const completionContent = completion.choices[0].message.content.trim();
    if (completionContent === "") {
      return [];
    }

    const matchedUserIds = completionContent
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^[a-f\d]{24}$/i.test(id));

    if (matchedUserIds.length === 0) {
      return [];
    }

    const matchedUsers = matchedUserIds.map((id) =>
      availableUsers.find((user) => user._id.toString() === id)
    );

    if (matchedUsers.every((user) => !user)) {
      return [];
    }

    const resultUsers = matchedUsers
      .filter((user) => user._id.toString() !== userId.toString())
      .map((user) => ({
        _id: user._id,
        fullname: user.fullname,
        availabilityStatus: user.availabilityStatus,
        imageProfile: user.profileImage,
      }));

    return resultUsers;
  } catch (error) {
    console.error("Error fetching or filtering users:", error);
    return [];
  }
};

router.post("/chat", authorize("User", "Admin"), async (req, res) => {
  try {
    const { userInput } = req.body;
    const userDisabilityType = req.user.dissabilityType;

    const matchingUsers = await getUsersWithMatchingExperience(
      userInput,
      userDisabilityType,
      req.user._id
    );

    if (matchingUsers.length === 0) {
      return res
        .status(200)
        .json({ message: "No users with matching experience found." });
    }

    res.status(200).json(matchingUsers);
  } catch (error) {
    console.error("Error in chat route:", error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

export default router;
