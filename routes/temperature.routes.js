import express from "express";
import { saveTemperature, getTemperatureHistory } from "../controllers/temperature.controller.js";

const router = express.Router();

router.post("/add", saveTemperature);
router.get("/history", getTemperatureHistory);

export default router;