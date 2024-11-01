import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const user = process.env.DB_USER;
    const password = process.env.DB_USER_PASSWORD;
    const databaseName = process.env.DB_NAME;

    const mongoUrl = `mongodb+srv://${user}:${password}@cluster0.adk6n.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=Cluster0`;

    cached.promise = mongoose.connect(mongoUrl).then((mongoose) => mongoose);

    cached.conn = await cached.promise;
  }

  return cached.conn;
};

const disconnectFromDatabase = async () => {
  if (cached.conn) {
    try {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error("Error disconnecting from MongoDB", error);
    }
  }
};

export { connectToDatabase, disconnectFromDatabase };
