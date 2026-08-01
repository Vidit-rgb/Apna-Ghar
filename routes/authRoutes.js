import express from "express";

import {
  registerUser,
  loginUser,
  verifyUserEmail,
  resendUserOTP,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/verify-email", verifyUserEmail);

router.post("/resend-otp", resendUserOTP);

router.get("/profile/:id", getUserProfile);

router.put("/profile/:id", updateUserProfile);

router.put(
  "/change-password/:id",
  changeUserPassword
);

export default router;