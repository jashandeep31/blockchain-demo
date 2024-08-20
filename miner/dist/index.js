import { io } from "socket.io-client";
import { Block, Blockchain } from "./blockchain.js";
import { uuid } from "uuidv4";
import express from "express";
import cors from "cors";
const app = express();
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
let MY_ID = uuid();
const createAccountFunction = () => {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/0'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const publicKey = Keypair.fromSecretKey(secretKey).publicKey.toBase58();
    return { publicKey, secretKey };
};
export const MY_ACCOUNT = createAccountFunction();
console.log(MY_ACCOUNT.publicKey, `we have `);
const socket = io("http://localhost:8000/");
console.log(`Miner is ready to work ${process.env.PORT}`);
const blockchain = new Blockchain();
socket.on("connect", () => {
    MY_ID = socket.id || MY_ID;
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
    socket.emit("blockchain", blockchain);
});
socket.on("blockchain", ({ chain }) => {
    if (chain.length > blockchain.chain.length) {
        const tempBlockchain = new Blockchain();
        for (let block of chain) {
            const newBlock = new Block(block);
            tempBlockchain.validateAndAddBlock(newBlock, false);
        }
        console.log(`
      
    
        our lehgnt ${blockchain.chain.length} 
        their ${chain.length} 
      
      I accepteeddd
      
      
      
      `);
        blockchain.chain = tempBlockchain.chain;
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
        publicKey: MY_ACCOUNT.publicKey,
        blockchain,
    });
}
// Broadcast a new block to other miners
export const broadCastBlock = (block) => {
    console.log(block.seq, `thisis bordcaseted`);
    socket.emit("newBlock", block);
};
app.use(express.json());
app.use(cors());
app.get("/balance", (req, res) => {
    const publicKey = req.query.key;
    if (!publicKey || typeof publicKey !== "string") {
        return res.status(404).json({
            message: "public key is required",
        });
    }
    const balance = blockchain.getBalance(publicKey);
    res.status(200).json({
        balance,
    });
});
app.get("/transaction", (req, res) => {
    const signature = req.query.signature;
    if (!signature || typeof signature !== "string") {
        return res.status(404).json({
            message: "public key is required",
        });
    }
    const transaction = blockchain.getTransactionBySignature(signature);
    res.status(200).json({
        transaction,
    });
});
app.get("/transactions", (req, res) => {
    const publicKey = req.query.publicKey;
    if (!publicKey || typeof publicKey !== "string") {
        return res.status(404).json({
            message: "public key is required",
        });
    }
    const transactions = blockchain.getUserTransaction(publicKey);
    res.status(200).json({
        transactions,
    });
});
app.listen(process.env.PORT, () => { });
