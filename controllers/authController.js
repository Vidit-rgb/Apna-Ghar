import User from "../models/User.js";
import Owner from "../models/Owner.js";
import EmailVerification from "../models/EmailVerification.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(mobile);
};


// ================= REGISTER USER =================

export const registerUser = async (req, res) => {
  try {

    let {
      username,
      email,
      mobile,
      gender,
      password,
    } = req.body;

    username = username?.trim();
    email = email?.trim().toLowerCase();
    mobile = mobile?.trim();

    if (
      !username ||
      !email ||
      !mobile ||
      !gender ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10 digit mobile number",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check USER email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check OWNER email
    const existingOwner = await Owner.findOne({ email });

    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Username check
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      mobile,
      gender,
      password: hashedPassword,
      emailVerified: false,
    });

    const otp = generateOTP();

    await EmailVerification.deleteMany({
      accountId: user._id,
      role: "user",
    });

    await EmailVerification.create({
      accountId: user._id,
      email,
      role: "user",
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail(email, otp);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email",
      email,
      role: "user",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= VERIFY USER EMAIL =================

export const verifyUserEmail = async (req, res) => {
  try {

    const { email, otp } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const verification = await EmailVerification.findOne({
      accountId: user._id,
      email: normalizedEmail,
      role: "user",
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please resend OTP",
      });
    }

    if (verification.expiresAt < new Date()) {

      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP",
      });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.emailVerified = true;

    await user.save();

    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= RESEND USER OTP =================

export const resendUserOTP = async (req, res) => {
  try {

    const email = req.body.email?.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const otp = generateOTP();

    await EmailVerification.deleteMany({
      accountId: user._id,
      role: "user",
    });

    await EmailVerification.create({
      accountId: user._id,
      email,
      role: "user",
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "New OTP sent",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= USER LOGIN =================

export const loginUser = async (req, res) => {
  try {

    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const safeUser = user.toObject();

    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: safeUser,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= PROFILE =================

export const getUserProfile = async (req, res) => {
  try {

    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= UPDATE PROFILE =================

export const updateUserProfile = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      username,
      email,
      mobile,
      gender,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const duplicateUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    const duplicateOwner = await Owner.findOne({
      email: normalizedEmail,
    });

    if (duplicateUser || duplicateOwner) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        username,
        email: normalizedEmail,
        mobile,
        gender,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= CHANGE PASSWORD =================

export const changeUserPassword = async (req, res) => {
  try {

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current Password Incorrect",
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Changed Successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};