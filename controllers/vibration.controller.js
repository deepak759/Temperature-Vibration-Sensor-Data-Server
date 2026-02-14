import VibrationReading from '../models/VibrationReading.js';
import { vibrationService } from '../services/vibration.service.js';

// GET /api/vibration/live
export const getLive = async (req, res) => {
  const live = vibrationService.getLatest();
  return res.json(live);
};

// GET /api/vibration/history?from=ISO&to=ISO&limit=100
export const getHistory = async (req, res) => {
  const { from, to, limit = 100 } = req.query;
  const q = {};
  if (from || to) q.timestamp = {};
  if (from) q.timestamp.$gte = new Date(from);
  if (to) q.timestamp.$lte = new Date(to);

  const docs = await VibrationReading.find(q)
    .sort({ timestamp: -1 })
    .limit(Number(limit));



  return res.json({ ok: true, count: docs.length, data: docs });
};

// POST /api/vibration/manual-read  (optional one-shot poll)
export const manualRead = async (req, res) => {
  try {
    const sample = await vibrationService.poll();
    return res.json(sample);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};