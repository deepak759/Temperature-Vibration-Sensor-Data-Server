import express from "express";
import {
  addViewerUser,
  getPlantUsers,
  addAlertEmail,
  getPlantAlertEmails,
  removeAlertEmail
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Add viewer user to plant
router.post("/plants/:plantId/users", requireAdmin, addViewerUser);

// Get all users for a plant
router.get("/plants/:plantId/users", requireAdmin, getPlantUsers);

// Add alert email for a plant
router.post("/plants/:plantId/alert-emails", requireAdmin, addAlertEmail);

// Get all alert emails for a plant
router.get("/plants/:plantId/alert-emails", requireAdmin, getPlantAlertEmails);

// Remove alert email
router.delete("/plants/:plantId/alert-emails/:alertEmailId", requireAdmin, removeAlertEmail);

export default router;
