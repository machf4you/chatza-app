const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
});

const rooms = new Map(); // roomId -> { hostId }
const names = new Map(); // socketId -> name

function roomSocketIds(roomId) {
  return io.sockets.adapter.rooms.get(roomId) || new Set();
}

function getRoomSize(roomId) {
  const s = roomSocketIds(roomId);
  return s ? s.size : 0;
}

function ensureValidHost(roomId) {
  const sockets = roomSocketIds(roomId);
  if (!sockets || sockets.size === 0) {
    rooms.delete(roomId);
    return null;
  }

  const rec = rooms.get(roomId);
  const currentHostId = rec?.hostId;

  // if no host set OR host not actually in the room anymore -> elect first socket in room
  if (!currentHostId || !sockets.has(currentHostId)) {
    const first = sockets.values().next().value;
    rooms.set(roomId, { hostId: first });
    return first;
  }

  return currentHostId;
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("join-room", ({ roomId, name }) => {
    if (!roomId) return;

    // Enforce 1-to-1 limit
    if (getRoomSize(roomId) >= 2) {
      socket.emit("room-full", { roomId });
      return;
    }


    const safeName = (name || "Guest").toString().trim() || "Guest";
    names.set(socket.id, safeName);

    socket.join(roomId);
    socket.data.roomId = roomId;

    // if first time we see this room, set host immediately
    if (!rooms.has(roomId)) rooms.set(roomId, { hostId: socket.id });

    // ✅ make sure hostId is valid for CURRENT room members
    const hostId = ensureValidHost(roomId);
    const isHost = socket.id === hostId;

    // peers list for joiner
    const peers = [];
    const sockets = roomSocketIds(roomId);

    sockets.forEach((id) => {
      if (id === socket.id) return;
      peers.push({
        peerId: id,
        name: names.get(id) || "Guest",
        isHost: id === hostId,
      });
    });

    console.log(
      "join-room",
      roomId,
      "size",
      getRoomSize(roomId),
      "me",
      socket.id,
      "name",
      safeName,
      "hostId",
      hostId,
      "peers",
      peers.map((p) => `${p.peerId}:${p.name}${p.isHost ? "(host)" : ""}`)
    );

    socket.emit("room-peers", { peers });

    socket.to(roomId).emit("peer-joined", {
      peerId: socket.id,
      name: safeName,
      isHost,
    });
  });

  socket.on("disconnect", (reason) => {
    const roomId = socket.data.roomId;
    console.log("socket disconnected", socket.id, reason);

    if (roomId) socket.to(roomId).emit("peer-left", { peerId: socket.id });

    names.delete(socket.id);

    if (!roomId) return;

    // ✅ if room is now empty, delete record so next join becomes host cleanly
    const size = getRoomSize(roomId);
    if (size === 0) rooms.delete(roomId);
    else ensureValidHost(roomId);
  });

  // SIGNALING (targeted)
  socket.on("webrtc-offer", ({ to, sdp }) => {
    io.to(to).emit("webrtc-offer", { from: socket.id, sdp });
  });

  socket.on("webrtc-answer", ({ to, sdp }) => {
    io.to(to).emit("webrtc-answer", { from: socket.id, sdp });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    io.to(to).emit("webrtc-ice", { from: socket.id, candidate });
  });

  // CHAT (room broadcast)
  socket.on("chat-message", (payload) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("chat-message", payload);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log("signaling server running on port", PORT));
