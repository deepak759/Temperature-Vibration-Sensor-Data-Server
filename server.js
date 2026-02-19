import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import vibrationRoutes from "./routes/vibration.routes.js";
// import temperatureRoutes from "./routes/temperature.routes.js";
import { sensorSocket } from "./sockets/sensorSocket.js";
import { vibrationService } from "./services/vibration.service.js";
import userRoutes from "./routes/user.routes.js";
import plantRoutes from "./routes/plant.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import godadminRoutes from "./routes/godadmin.routes.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" }
});
// Middlewares
app.use(express.json());
app.use(cors());

// DB
connectDB();

// Routes
// app.use("/api/vibration", vibrationRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/godadmin", godadminRoutes);
// app.use("/api/temperature", temperatureRoutes);

// WebSocket
// sensorSocket(io);

// Start polling
// vibrationService.start();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));