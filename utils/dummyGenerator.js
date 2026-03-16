export const generateDummyData = (io) => {
  setInterval(async () => {
    const vibration = {
      // or compute from x/y/z

     values: {
        accel: {
          rms: Number((Math.random() * 5).toFixed(2)),
          max: Number((Math.random() * 5).toFixed(2)),
          peakToPeak: Number((Math.random() * 5).toFixed(2)),
        },
        velocity: {
          rms: Number((Math.random() * 5).toFixed(2)),
        },
        crestFactor: Number((Math.random()).toFixed(2)),
      }
    };

    const temperature = {
      temperature: (25 + Math.random() * 10).toFixed(2),
    };

    // Emit to clients
    io.emit('vibration-data', vibration);
    io.emit('temperature-data', temperature);

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
