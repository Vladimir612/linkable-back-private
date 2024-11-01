import Chat from "./schemas/ChatSchema.js";

const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("New user is connected:", socket.id);

    socket.on("joinRoom", ({ chatId }) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on("sendMessage", async ({ chatId, senderId, content }) => {
      try {
        const newMessage = { sender: senderId, content: content };

        const chat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: newMessage },
            lastUpdated: Date.now(),
          },
          { new: true }
        ).populate("messages.sender", "profileImage fullname");

        io.to(chatId).emit(
          "receiveMessage",
          chat.messages[chat.messages.length - 1]
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User is disconnected:", socket.id);
    });
  });
};

export default socketHandlers;
