import { io } from "socket.io-client";

export const socket = io("https://bluff-revolver-server.onrender.com", {
  transports: ["websocket", "polling"], // ✅ fallback support
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true
});

// ✅ Debug logs (VERY useful for live issues)
socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("⚠️ Connection Error:", err.message);
});