import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createServer } from "http";
import cors from "cors";
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8000;
const onGoingBlockChains = [];
// App configuration
const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {},
});
io.on("connection", (socket) => {
    socket.on("requestBlockchain", () => {
        console.log(`now we have requet feed this poort`);
        // socket.broadcast.to("miners").emit("requestBlockchain");
        io.to("miners").emit("requestBlockchain");
    });
    socket.on("blockchain", (data) => {
        // i have the blockchain data let me send it to you
        console.log(`chakti block chain`);
        io.to("miners").emit("blockchain", data);
        // socket.broadcast.to("miners").emit("blockchain", data);
    });
    socket.on("join_miners", () => {
        socket.join("miners");
    });
    socket.on("newBlock", (data) => {
        console.log(data.hash);
        socket.broadcast.to("miners").emit("newBlock", data);
    });
    socket.on("transaction", (data) => {
        socket.broadcast.to("miners").emit("transaction", data);
    });
    socket.on("myblockchain", async ({ id, blockchain }) => {
        const index = onGoingBlockChains.findIndex((item) => item.id === id);
        if (index !== -1) {
            onGoingBlockChains[index] = { id, blockchain };
        }
        else {
            onGoingBlockChains.push({ id, blockchain });
        }
        await sendMessage(); // Ensure the sendMessage is fully completed after the previous operations
    });
    socket.on("get_on_going_block_chains", () => {
        socket.emit("on_going_block_chains", onGoingBlockChains);
    });
    // setInterval(() => {
    const sendMessage = () => {
        io.emit("on_going_block_chains", onGoingBlockChains);
    };
    // }, 1000);
});
server.listen(PORT, () => console.log(`Server is running at PORT ${PORT}`));
