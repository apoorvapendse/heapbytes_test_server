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
  userAgent: String,
});
const UserIPCollection = mongoose.model("UserIPCollection", userSchema);

// Middleware to track and store client IP address and User-Agent
app.use(async (req, res, next) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ips = forwardedFor ? forwardedFor.split(",") : [];
  const userIP = ips[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"]; // Capture the User-Agent

  try {
    let user;

    if (userAgent) {
      // Find a user by User-Agent
      user = await UserIPCollection.findOne({ userAgent });
    } else {
      // If no User-Agent is provided, use the user's IP address
      user = await UserIPCollection.findOne({ ip: userIP });
    }

    if (user) {
      if (user.visitCount > 500) {
        // Send a response and return to prevent further execution
        return res.send("You are banned");
      }
      user.visitCount++;

      // Update the User-Agent, if available
      if (userAgent) {
        user.userAgent = userAgent;
      }

      await user.save();
    } else {
      user = new UserIPCollection({ ip: userIP, userAgent, visitCount: 1 });
      await user.save();
    }

    next();
  } catch (error) {
    console.error("Error tracking user visits:", error);
    // Continue with the next middleware even if there's an error
    next();
  }
});

// Route to display user information
app.get("/", async (req, res) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const userIP = forwardedFor
    ? forwardedFor.split(",")[0]
    : req.connection.remoteAddress;

  const totalVisits = await UserIPCollection.aggregate([
    {
      $group: {
        _id: null,
        totalVisits: { $sum: "$visitCount" },
      },
    },
  ]);

  const user = await UserIPCollection.findOne({ ip: userIP });

  res.json({
    status: "User Info",
    ip: user.ip,
    userAgent: user.userAgent, // Include the User-Agent in the response
    visitCount: user.visitCount,
    totalVisitCount: totalVisits.length > 0 ? totalVisits[0].totalVisits : 0,
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
//
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
