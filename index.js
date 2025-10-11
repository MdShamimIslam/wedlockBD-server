import express from "express";
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import successStoryRoutes from "./src/routes/successStoryRoutes.js";
import contactRequestRoutes from "./src/routes/contactRequestRoutes.js";
import adminStatsRoutes from "./src/routes/adminStatsRoutes.js";
import userStatsRoutes from "./src/routes/userStatsRoutes.js";
import premiumBioRoutes from "./src/routes/premiumBioRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import biodataRoutes from "./src/routes/biodataRoutes.js";
import profileViewRoutes from "./src/routes/profileViewRoutes.js";
import overviewRoutes from "./src/routes/overviewRoutes.js";


const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();

    app.use("/jwt", authRoutes);
    app.use("/users", userRoutes);
    app.use("/biodatas", biodataRoutes);
    app.use("/favorites", favoriteRoutes);
    app.use("/contact-request", contactRequestRoutes);
    app.use("/user-stats", userStatsRoutes);
    app.use("/success-stories", successStoryRoutes);
    app.use("/profile-views", profileViewRoutes);
    app.use("/overview", overviewRoutes);
    app.use("/premium-bio", premiumBioRoutes);
    app.use("/admin-stats", adminStatsRoutes);

    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });

  } catch (err) {
    console.error("Failed to connect DB", err);
    process.exit(1);
  }
}

startServer();



