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

    const mongoUrl = `mongodb+srv://${user}:${password}@cluster0.1wsr6.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=Cluster0`;

    cached.promise = mongoose
      .connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => mongoose);

    cached.conn = await cached.promise;
  }

  return cached.conn;
};

export default connectToDatabase;
