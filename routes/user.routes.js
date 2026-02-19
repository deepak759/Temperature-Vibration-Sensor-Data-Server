import express from "express";

import {
  register,
  verifyOTP,
  login,
  resendOTP
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/verify-otp", verifyOTP);

router.post("/login", login);

router.post("/resend-otp", resendOTP);

export default router;
