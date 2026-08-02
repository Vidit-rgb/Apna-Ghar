import Owner from "../models/Owner.js";
import User from "../models/User.js";
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


// ================= REGISTER OWNER =================

export const registerOwner = async (req, res) => {
  try {
    let {
      username,
      email,
      mobile,
      password,
    } = req.body;

    username = username?.trim();
    email = email?.trim().toLowerCase();
    mobile = mobile?.trim();

    if (!username || !email || !mobile || !password) {
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

    // Check Owner email
    const existingOwner = await Owner.findOne({ email });

    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check User email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check Owner username
    const existingUsername = await Owner.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Delete old pending owner registration
    await EmailVerification.deleteMany({
      email,
      role: "owner",
    });

    // Store owner registration temporarily
    await EmailVerification.create({
      email,
      role: "owner",
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),

      registrationData: {
        username,
        mobile,
        password: hashedPassword,
      },
    });

    // Send OTP
    //await sendVerificationEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email",
      email,
      role: "owner",
    });

    sendVerificationEmail(email, otp);

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= VERIFY OWNER EMAIL =================

export const verifyOwnerEmail = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find pending registration
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      role: "owner",
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please register again",
      });
    }

    // Check OTP expiry
    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again",
      });
    }

    // Check OTP
    if (verification.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Get temporary registration data
    const {
      username,
      mobile,
      password,
    } = verification.registrationData;

    // Double-check email
    const existingOwner = await Owner.findOne({
      email: normalizedEmail,
    });

    if (existingOwner) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create Owner ONLY AFTER OTP verification
    const owner = await Owner.create({
      username,
      email: normalizedEmail,
      mobile,
      password,
      emailVerified: true,
    });

    // Delete OTP record
    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified and owner account created successfully",
      ownerId: owner._id,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= RESEND OWNER OTP =================

export const resendOwnerOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const verification = await EmailVerification.findOne({
      email,
      role: "owner",
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Registration not found. Please register again",
      });
    }

    const otp = generateOTP();

    verification.otp = otp;
    verification.expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await verification.save();

    await sendVerificationEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "New OTP sent",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= OWNER LOGIN =================

export const loginOwner = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const owner = await Owner.findOne({ email });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!owner.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      owner.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: owner._id,
        role: "owner",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const safeOwner = owner.toObject();

    delete safeOwner.password;

    return res.status(200).json({
      success: true,
      message: "Owner Login Successful",
      token,
      owner: safeOwner,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= CHANGE PASSWORD =================

export const changePassword = async (req, res) => {
  try {
    const {
      ownerId,
      oldPassword,
      newPassword,
    } = req.body;

    const owner = await Owner.findById(ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    const isMatch = await bcrypt.compare(
      oldPassword,
      owner.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old Password is incorrect",
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    owner.password = await bcrypt.hash(
      newPassword,
      10
    );

    await owner.save();

    return res.status(200).json({
      success: true,
      message: "Password Changed Successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= GET PROFILE =================

export const getOwnerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findById(id)
      .select("-password");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    return res.status(200).json({
      success: true,
      owner,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= UPDATE PROFILE =================

export const updateOwnerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      username,
      email,
      mobile,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const duplicateOwner = await Owner.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    const duplicateUser = await User.findOne({
      email: normalizedEmail,
    });

    if (duplicateOwner || duplicateUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const owner = await Owner.findByIdAndUpdate(
      id,
      {
        username,
        email: normalizedEmail,
        mobile,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      owner,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};