// backend/utils/socket.js
// Stores the io instance and exposes emit helpers.
// Routes import from here — never import ../socket directly.

let _io = null;

const setIO = (io) => { _io = io; };
const getIO = ()    => { if (!_io) throw new Error("Socket.IO not initialised"); return _io; };

const emitToRoom      = (room, event, data) => { _io?.to(room).emit(event, data); };
const emitNotification = (userId, notif)    => { _io?.to(`user:${userId}`).emit("notification", notif); };
const emitBroadcast   = (event, data)       => { _io?.emit(event, data); };

module.exports = { setIO, getIO, emitToRoom, emitNotification, emitBroadcast };