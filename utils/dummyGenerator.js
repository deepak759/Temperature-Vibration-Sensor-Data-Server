import { saveVibrationSample, saveTemperatureSample } from "../services/sensorData.js";

export const generateDummyData = (io) => {
  setInterval(async () => {
    const vibration = {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      rms: Math.random(), // or compute from x/y/z
    };

    const temperature = {
      temperature: (25 + Math.random() * 10).toFixed(2),
    };

    // Emit to clients
    io.emit("vibration-data", vibration);
    io.emit("temperature-data", temperature);

    // Persist in DB
    // try {
    //   await Promise.all([
    //     saveVibrationSample(vibration, "dummy"),
    //     saveTemperatureSample(temperature, "dummy"),
    //   ]);
    // } catch (err) {
    //   console.error("Dummy save error:", err.message);
    // }
  }, 5000);
};