// backend/socket.js
const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const { setIO }  = require("./utils/socket");

const init = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","),
      credentials: true,
    },
    transports:    ["websocket", "polling"],
    pingTimeout:   300_000,
    pingInterval:  25_000,
  });

  // Store io reference so utils/socket.js can use it
  setIO(io);

  // Auth middleware — attaches socket.user if token present
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
               || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) { socket.user = null; return next(); }
    try {
      const { User } = require("./models");
      const decoded  = jwt.verify(token, process.env.JWT_SECRET);
      socket.user    = await User.findById(decoded.userId).select("_id name username");
    } catch { socket.user = null; }
    next();
  });

  io.on("connection", (socket) => {
    const uid = socket.user?._id?.toString();
    if (uid) socket.join(`user:${uid}`);

    socket.on("join:idea",    (id) => isValidId(id) && socket.join(`idea:${id}`));
    socket.on("leave:idea",   (id) => socket.leave(`idea:${id}`));
    socket.on("join:battle",  (id) => isValidId(id) && socket.join(`battle:${id}`));
    socket.on("leave:battle", (id) => socket.leave(`battle:${id}`));

    socket.on("typing:start", ({ ideaId }) => {
      if (!uid || !isValidId(ideaId)) return;
      socket.to(`idea:${ideaId}`).emit("typing:update", { userId: uid, username: socket.user.username, typing: true });
    });
    socket.on("typing:stop", ({ ideaId }) => {
      if (!uid || !isValidId(ideaId)) return;
      socket.to(`idea:${ideaId}`).emit("typing:update", { userId: uid, username: socket.user.username, typing: false });
    });

    socket.on("disconnect", (reason) => console.log(`[socket] disconnected id=${socket.id} reason=${reason}`));
  });

  console.log("[socket] Socket.IO initialised");
  return io;
};

const isValidId = (id) => /^[a-f\d]{24}$/i.test(String(id));

module.exports = { init };