import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../services/mailService.js";

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRY_MINUTES = 5;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// REGISTER
export const register = async (req, res) => {
  try {

    const { username, email, password } = req.body;

    const existing = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existing)
      return res.status(400).json({
        message: "User already exists"
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const otpExpiry = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    const deleteAt = otpExpiry;

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      emailOTP: otp,
      otpExpiry,
      deleteAt,
      emailVerified: false
    });

    await sendMail(email, "Verify your email", otp);

    res.json({
      message: "OTP sent to email",
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// VERIFY OTP
export const verifyOTP = async (req, res) => {

  try {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    if (user.emailVerified)
      return res.json({
        message: "Already verified"
      });

    if (user.emailOTP != otp)
      return res.status(400).json({
        message: "Invalid OTP"
      });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({
        message: "OTP expired"
      });

    user.emailVerified = true;
    user.emailOTP = null;
    user.otpExpiry = null;
    user.deleteAt = null;

    await user.save();

    res.json({
      message: "Email verified successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};




// LOGIN
export const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    if (!user.emailVerified)
      return res.status(400).json({
        message: "Email not verified"
      });

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid)
      return res.status(400).json({
        message: "Invalid password"
      });

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.accessToken = token;

    await user.save();

    // Get plant access details
    const plantAccessDetails = [];
    if (user.plantAccess && user.plantAccess.size > 0) {
      const Plant = (await import("../models/plant.model.js")).default;
      const plants = await Plant.find({ isActive: true }).select("_id name");

      user.plantAccess.forEach((accessType, plantId) => {
        const plant = plants.find(p => p._id.toString() === plantId);
        if (plant) {
          plantAccessDetails.push({
            plantId: plant._id,
            plantName: plant.name,
            accessType
          });
        }
      });
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        plantAccess: plantAccessDetails
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};



// RESEND OTP
export const resendOTP = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    if (user.emailVerified)
      return res.status(400).json({
        message: "Already verified"
      });

    const otp = generateOTP();

    user.emailOTP = otp;

    user.otpExpiry = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    user.deleteAt = user.otpExpiry;

    await user.save();

    await sendMail(email, "Verify your email", otp);

    res.json({
      message: "OTP resent"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};
