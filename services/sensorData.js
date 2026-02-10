// import Vibration from "../models/vibration.model.js";
// import Temperature from "../models/temperature.model.js";

// // ---- Write helpers ----

// export async function saveVibrationSample(sample, source = "http") {
//   // basic sanitize + defaults
//   const payload = {
//     x: Number(sample.x),
//     y: Number(sample.y),
//     z: Number(sample.z),
//     rms: Number(
//       sample.rms
//         ? sample.rms
//         : Math.sqrt((Number(sample.x) || 0) ** 2 + (Number(sample.y) || 0) ** 2 + (Number(sample.z) || 0) ** 2)
//     ),
//     timestamp: sample.timestamp ? new Date(sample.timestamp) : new Date(),
//     source,
//   };
//   return Vibration.create(payload);
// }

// export async function saveTemperatureSample(sample, source = "http") {
//   const payload = {
//     temperature: Number(sample.temperature ?? sample.value ?? sample.temp),
//     timestamp: sample.timestamp ? new Date(sample.timestamp) : new Date(),
//     source,
//   };
//   return Temperature.create(payload);
// }

// // ---- Read/query helpers for history endpoints ----

// export async function queryVibrationSamples(options = {}) {
//   const { from, to, limit = 500, source } = options;

//   const filter = {};
//   if (from || to) {
//     filter.timestamp = {};
//     if (from) filter.timestamp.$gte = new Date(from);
//     if (to) filter.timestamp.$lte = new Date(to);
//   }
//   if (source) {
//     filter.source = source;
//   }

//   return Vibration.find(filter)
//     .sort({ timestamp: 1 })
//     .limit(Number(limit) || 500);
// }

// export async function queryTemperatureSamples(options = {}) {
//   const { from, to, limit = 500, source } = options;

//   const filter = {};
//   if (from || to) {
//     filter.timestamp = {};
//     if (from) filter.timestamp.$gte = new Date(from);
//     if (to) filter.timestamp.$lte = new Date(to);
//   }
//   if (source) {
//     filter.source = source;
//   }

//   return Temperature.find(filter)
//     .sort({ timestamp: 1 })
//     .limit(Number(limit) || 500);
// }
