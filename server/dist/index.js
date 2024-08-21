import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createServer } from "http";
import cors from "cors";
import { initializeSocket } from "./socket_setup.js";
import routes from "./routes/index.js";
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8000;
export const onGoingBlockChains = [];
// App configuration
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/", routes);
const server = createServer(app);
export const io = new Server(server, {
    cors: {},
});
initializeSocket(io, onGoingBlockChains);
server.listen(PORT, () => console.log(`Server is running at PORT ${PORT}`));
