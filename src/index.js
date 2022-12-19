import dotenv from "dotenv";
import express from "express";
import { Server as SocketServer } from "socket.io";
import http from "http";

dotenv.config();
const { PORT, ORIGIN } = process.env;

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: ORIGIN,
  },
});

let activeUsers = [];

io.on("connection", (socket) => {
  // add new user
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    console.log("Connected Users", activeUsers);
    io.emit("get-users", activeUsers);
  });

  // send message
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("Sending from socket to: ", receiverId);
    console.log("Data: ", data);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnect ", activeUsers);
    io.emit("get-users", activeUsers);
  });
});

server.listen(PORT, () =>
  console.log(`run server in : http://localhost:${PORT}`)
);
