import User from "../schemas/UserSchema.js";
import Tag from "../schemas/TagSchema.js";

export const extractPublicId = (imagePath) => {
  const parts = imagePath.split("/");
  const fileNameWithExt = parts[parts.length - 1];
  const publicId = fileNameWithExt.split(".")[0];
  return publicId;
};

export const addTagsToUser = async (user, tags) => {
  for (const tag of tags) {
    // Proveri da li tag već postoji u bazi
    let existingTag = await Tag.findOne({ name: tag });

    // Ako tag ne postoji, kreiraj novi i dodaj u bazu
    if (!existingTag) {
      existingTag = new Tag({ name: tag });
      await existingTag.save();
    }

    // Dodaj tag referencu u niz tagova korisnika ako već nije tamo
    if (!user.tags.includes(existingTag._id)) {
      user.tags.push(existingTag._id);
    }
  }
  await user.save(); // Sačuvaj korisnika sa ažuriranim tagovima
};

export const sendToChatGPT = async (experiences) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiUrl = "https://api.openai.com/v1/chat/completions";

  const headers = {
    Authorization: `Bearer ${openaiApiKey}`,
    "Content-Type": "application/json",
  };

  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Extract key tags from the following user experiences.",
      },
      { role: "user", content: JSON.stringify(experiences) },
    ],
  };

  const response = await axios.post(openaiUrl, data, { headers });
  const gptResponse = response.data.choices[0].message.content;

  // Pretpostavljamo da odgovor vraća tagove kao niz reči
  return gptResponse.split(",").map((tag) => tag.trim());
};
