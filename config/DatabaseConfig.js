import { connect } from "mongoose";

const connectToDatabase = async () => {
  const user = process.env.DB_USER;
  const password = process.env.DB_USER_PASSWORD;
  const databaseName = process.env.DB_NAME;

  console.log(user, password, databaseName);

  const mongoUrl = `mongodb+srv://${user}:${password}@cluster0.1wsr6.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=Cluster0`;

  try {
    await connect(mongoUrl);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};

export default connectToDatabase;
