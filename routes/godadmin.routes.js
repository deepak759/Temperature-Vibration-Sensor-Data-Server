import express from "express";
import {
  getAllUsers,
  addAdminUser,
  removeAdminAccess
} from "../controllers/godadmin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireGodAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// View all users with their plant access
router.get("/users", requireGodAdmin, getAllUsers);

// Add user as admin for a plant
router.post("/plants/:plantId/admins", requireGodAdmin, addAdminUser);

// Remove admin access from a user
router.delete("/plants/:plantId/admins/:userId", requireGodAdmin, removeAdminAccess);

export default router;
