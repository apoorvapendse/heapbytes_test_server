import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database/databaseConnect.js";
import UserIPCollection from "./models/ipmodel.js";
dotenv.config();
const app = express();

const port = process.env.PORT;

app.use(async (req, res, next) => {
  const userIP = req.ip;
  try {
    let user = await UserIPCollection.findOne({ ip: userIP });

    if (user) {
      // If the user is found, update the visit count
      user.visitCount++;
      await user.save();
    } else {
      // If the user is not found, create a new entry
      user = new UserIPCollection({ ip: userIP, visitCount: 1 });
      await user.save();
    }

    next();
  } catch (error) {
    console.error("Error tracking user visits:", error);
    next();
  }
});

// Define a route to display user information
app.get("/", async (req, res) => {
  const userIP = req.ip;
  const user = await UserIPCollection.findOne({ ip: userIP });

  res.json({
    status: "User Info",
    ip: user.ip,
    visitCount: user.visitCount,
  });
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`server is listening on port ${port}`);
  });
});
