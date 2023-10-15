// app.js

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// Define a MongoDB schema and model
const userSchema = new mongoose.Schema({
  ip: String,
  visitCount: Number,
});
const UserIPCollection = mongoose.model("UserIPCollection", userSchema);

// Middleware to track and store client IP address
app.use(async (req, res, next) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ips = forwardedFor ? forwardedFor.split(",") : [];
  const userIP = ips[0] || req.socket.remoteAddress;

  try {
    let user = await UserIPCollection.findOne({ ip: userIP });

    if (user) {
      user.visitCount++;
      await user.save();
    } else {
      user = new UserIPCollection({ ip: userIP, visitCount: 1 });
      await user.save();
    }

    next();
  } catch (error) {
    console.error("Error tracking user visits:", error);
    next();
  }
});

// Route to display user information
app.get("/", async (req, res) => {
  const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const user = await UserIPCollection.findOne({ ip: userIP });

  res.json({
    status: "User Info",
    ip: user.ip,
    visitCount: user.visitCount,
  });
});

// Connect to the MongoDB database
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
