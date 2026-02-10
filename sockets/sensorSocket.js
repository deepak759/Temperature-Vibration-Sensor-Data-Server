import { vibrationService } from '../services/vibration.service.js';

export function sensorSocket(io) {
  vibrationService.on("data", (data) => {
    io.emit("vibration-data", data);
  });

  vibrationService.on("status", (status) => {
    io.emit("vibration-status", status);
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("welcome", "WebSocket Connected");

    const latest = vibrationService.getLatest();
    if (latest?.ok) {
      socket.emit("vibration-data", latest);
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}
