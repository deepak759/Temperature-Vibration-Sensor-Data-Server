import express from "express";
import {
  getAllPlants,
  getPlantById,
  createPlant,
  updatePlant,
  deletePlant
} from "../controllers/plant.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireGodAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all plants (godadmin only)
router.get("/", requireGodAdmin, getAllPlants);

// Get single plant
router.get("/:plantId", getPlantById);

// Create plant (godadmin only)
router.post("/", requireGodAdmin, createPlant);

// Update plant (godadmin only)
router.put("/:plantId", requireGodAdmin, updatePlant);

// Delete plant (godadmin only)
router.delete("/:plantId", requireGodAdmin, deletePlant);

export default router;
