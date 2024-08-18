import { io } from "socket.io-client";
import { Block, Blockchain } from "./blockchain.js";
import { uuid } from "uuidv4";
const MY_ID = uuid();
const socket = io("http://localhost:8000/");
console.log(`Miner is ready to work ${process.env.PORT}`);
const blockchain = new Blockchain();
socket.on("connect", () => {
    console.log("Connected to server");
    socket.emit("join_miners");
    socket.emit("requestBlockchain");
});
// Request blockchain data
export function getMeBlockchain() {
    console.log(`Requested new blockchain`);
    socket.emit("requestBlockchain");
}
// Send blockchain to other miners
socket.on("requestBlockchain", () => {
    console.log(`Sending blockchain`);
    socket.emit("blockchain", blockchain);
});
socket.on("blockchain", ({ chain }) => {
    console.log(`Chain arrived...`, chain.length, blockchain.chain.length);
    if (chain.length > blockchain.chain.length) {
        const tempBlockchain = new Blockchain();
        for (let block of chain) {
            const newBlock = new Block(block);
            tempBlockchain.putBlockToChain(newBlock);
            console.log(tempBlockchain.chain.length);
        }
        blockchain.chain = tempBlockchain.chain;
        console.log(blockchain.chain.length, `This is our new chains`);
    }
    sendUpdateBlockChainToServer(blockchain);
});
socket.on("transaction", (data) => {
    blockchain.addTransaction(data);
});
socket.on("newBlock", (data) => {
    blockchain.validateAndAddBlock(data);
});
export function sendUpdateBlockChainToServer(blockchain) {
    socket.emit("myblockchain", {
        id: MY_ID,
        blockchain,
    });
}
// Broadcast a new block to other miners
export const broadCastBlock = (block) => {
    socket.emit("newBlock", block);
};
