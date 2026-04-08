// backend/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");

  await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });

  mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
  mongoose.connection.on("reconnected",  () => console.log("[db] MongoDB reconnected"));
  mongoose.connection.on("error",    (e) => console.error("[db] MongoDB error:", e.message));

  console.log(`[db] Connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;