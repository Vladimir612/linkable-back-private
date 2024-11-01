import Chat from "./schemas/ChatSchema.js";
import Message from "./schemas/MessageSchema.js";

const socketHandlers = (io) => {
  console.log("Socket server is running");

  const connectedUsers = {};

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      console.error("User ID not provided in handshake");
      return;
    }

    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);

    socket.on(
      "sendMessage",
      async ({ chatId, senderId, receiverId, content }) => {
        console.log(
          `Received message from ${senderId} to ${receiverId}: ${content}`
        );

        try {
          let chat;

          if (chatId) {
            chat = await Chat.findById(chatId);
            if (!chat) {
              console.error("Chat not found for chatId:", chatId);
              return;
            }
          } else if (receiverId) {
            const participants = [senderId, receiverId].sort();

            chat = await Chat.findOne({ participants: participants });

            if (!chat) {
              chat = new Chat({
                participants: participants,
                messages: [],
              });
              await chat.save();
              console.log(`New chat created with ID: ${chat._id}`);
            }
          } else {
            console.error("Neither chatId nor receiverId provided");
            return;
          }

          const newMessage = new Message({
            sender: senderId,
            content: content,
          });

          await newMessage.save();

          chat.messages.push(newMessage._id);
          chat.lastUpdated = Date.now();
          await chat.save();

          await newMessage.populate("sender", "profileImage fullname");

          if (connectedUsers[senderId]) {
            io.to(connectedUsers[senderId]).emit("receiveMessage", {
              chatId: chat._id,
              senderId,
              message: newMessage,
            });
          }

          if (connectedUsers[receiverId]) {
            io.to(connectedUsers[receiverId]).emit("receiveMessage", {
              chatId: chat._id,
              senderId,
              message: newMessage,
            });
          } else {
            console.log(`User ${receiverId} is not connected`);
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User is disconnected:", socket.id);
      if (userId && connectedUsers[userId]) {
        delete connectedUsers[userId];
        console.log(`User ${userId} disconnected`);
      }
    });
  });
};

export default socketHandlers;
