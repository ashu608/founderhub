// src/hooks/useSocket.js
import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { useNotifStore } from "@/store/index";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

let socketInstance = null;

const getSocket = (token) => {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
};

export const useSocket = () => {
  const token   = useAuthStore(s => s.token);
  const addNotif = useNotifStore(s => s.add);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("connect",    () => console.log("[socket] connected", socket.id));
    socket.on("disconnect", (r) => console.log("[socket] disconnected", r));
    socket.on("notification", addNotif);

    return () => {
      socket.off("notification", addNotif);
    };
  }, [token, addNotif]);

  const joinRoom  = useCallback((room) => socketRef.current?.emit(`join:${room.split(":")[0]}`, room.split(":")[1]), []);
  const leaveRoom = useCallback((room) => socketRef.current?.emit(`leave:${room.split(":")[0]}`, room.split(":")[1]), []);
  const on        = useCallback((event, cb) => { socketRef.current?.on(event, cb); return () => socketRef.current?.off(event, cb); }, []);
  const emit      = useCallback((event, data) => socketRef.current?.emit(event, data), []);

  return { socket: socketRef.current, joinRoom, leaveRoom, on, emit };
};

// Specialised hook for a single idea room
export const useIdeaSocket = (ideaId, handlers = {}) => {
  const { joinRoom, leaveRoom, on } = useSocket();

  useEffect(() => {
    if (!ideaId) return;
    joinRoom(`idea:${ideaId}`);
    const cleanups = Object.entries(handlers).map(([event, cb]) => on(event, cb));
    return () => {
      leaveRoom(`idea:${ideaId}`);
      cleanups.forEach(off => off?.());
    };
  }, [ideaId]); // eslint-disable-line
};

// Specialised hook for a battle room
export const useBattleSocket = (battleId, handlers = {}) => {
  const { joinRoom, leaveRoom, on } = useSocket();

  useEffect(() => {
    if (!battleId) return;
    joinRoom(`battle:${battleId}`);
    const cleanups = Object.entries(handlers).map(([event, cb]) => on(event, cb));
    return () => {
      leaveRoom(`battle:${battleId}`);
      cleanups.forEach(off => off?.());
    };
  }, [battleId]); // eslint-disable-line
};