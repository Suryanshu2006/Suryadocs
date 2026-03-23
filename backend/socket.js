const { Server } = require("socket.io");
const Document = require('./models/Document');

// In-memory debounce timers for saving documents
const saveTimers = {};

module.exports = function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-document", (documentId) => {
      socket.join(documentId);
      console.log(`[Socket] ${socket.id} joined document ${documentId}`);
    });

    socket.on("sync-update", ({ documentId, update }) => {
      // Broadcast the Yjs update to all other clients in the room
      socket.to(documentId).emit("sync-update", update);

      // Debounce saving the full document update to the database (if provided by client)
      // Actually we will rely on a dedicated save REST endpoint from the client, or we could save the update array here.
      // For a robust system we just broadcast.
    });

    socket.on("cursor-update", ({ documentId, cursor }) => {
      socket.to(documentId).emit("cursor-update", { clientId: socket.id, cursor });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] ${socket.id} disconnected`);
    });
  });

  return io;
};
