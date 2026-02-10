// config/modbus.js
import EventEmitter from "events";
import ModbusRTU from "modbus-serial";

class ModbusClient extends EventEmitter {
  constructor() {
    super();
    this.client = new ModbusRTU();

    this.ip = process.env.TGW_IP || "192.168.1.100";
    this.port = Number(process.env.TGW_PORT || 502);
    this.slaveId = Number(process.env.SLAVE_ID || 1);

    this.connected = false;
    this.connecting = false;
  }

  async connect() {
    if (this.connected || this.connecting) return;

    this.connecting = true;
    console.log("[MODBUS] Connecting...");

    try {
      await this.client.connectTCP(this.ip, { port: this.port });
      this.client.setID(this.slaveId);
      this.client.setTimeout(2000);

      this.connected = true;
      console.log("[MODBUS] Connected to", this.ip);
      this.emit("connected");
    } catch (err) {
      console.error("[MODBUS] Connect failed:", err.message);
      this.connected = false;
    } finally {
      this.connecting = false;
    }
  }

  async ensureConnected() {
    if (!this.connected) {
      await this.connect();
    }
    if (!this.connected) {
      throw new Error("Modbus not connected");
    }
  }

  async readInput(start, len) {
    await this.ensureConnected();
    return this.client.readInputRegisters(start, len);
  }
}

export const modbus = new ModbusClient();
