// ============================================================
//  FOUNDERHUB — Server Entry Point
//  File: server.js  (project root)
//  Run: node server.js  |  nodemon server.js
// ============================================================

require("dotenv").config();
const http       = require("http");
const app        = require("./app");
const { init }   = require("./socket");
const connectDB  = require("./config/db");
const { startCrons } = require("./cron");

const PORT = process.env.PORT || 5000;

// ── 1. Connect to MongoDB ─────────────────────────────────────
connectDB().then(() => {

  // ── 2. Create HTTP server (shared with Socket.IO) ───────────
  const httpServer = http.createServer(app);

  // ── 3. Attach Socket.IO ──────────────────────────────────────
  init(httpServer);

  // ── 4. Start cron jobs ───────────────────────────────────────
  startCrons();

  // ── 5. Listen ────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 FounderHub server running on port ${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   MongoDB     : connected`);
    console.log(`   Socket.IO   : attached\n`);
  });

}).catch((err) => {
  console.error("❌ Failed to connect to MongoDB:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully");
  process.exit(0);
});