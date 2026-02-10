// import { saveTemperatureSample, queryTemperatureSamples } from "../services/sensorData.js";

// export const saveTemperature = async (req, res) => {
//   try {
//     const data = await saveTemperatureSample(req.body, "http");
//     res.json({ success: true, data });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };

// export const getTemperatureHistory = async (req, res) => {
//   try {
//     const { from, to, limit, source } = req.query;
//     const data = await queryTemperatureSamples({ from, to, limit, source });
//     res.json({ success: true, data });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };