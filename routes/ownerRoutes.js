import express from "express";

import {
  registerOwner,
  loginOwner,
  verifyOwnerEmail,
  resendOwnerOTP,
  changePassword,
  getOwnerProfile,
  updateOwnerProfile,
} from "../controllers/ownerController.js";

const router = express.Router();

router.post("/register", registerOwner);

router.post("/login", loginOwner);

router.post("/verify-email", verifyOwnerEmail);

router.post("/resend-otp", resendOwnerOTP);

router.put("/change-password", changePassword);

router.get("/profile/:id", getOwnerProfile);

router.put("/profile/:id", updateOwnerProfile);

export default router;