import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "owner"],
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // Registration data temporarily stored until OTP verification
    registrationData: {
      username: String,
      mobile: String,
      gender: String,
      password: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);