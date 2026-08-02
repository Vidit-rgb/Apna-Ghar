import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import pgRoutes from "./routes/pgRoutes.js";
import path from "path";
import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");




const app = express();

// Connect Database
connectDB();

// Middleware
app.use(
  cors({
    origin: "https://apnaghar-frontend-nine.vercel.app",
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/pg", pgRoutes);
app.use("/api/booking", bookingRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Apna Ghar Backend Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});