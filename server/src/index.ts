import express, { json } from "express";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import { createServer } from "http";
import cors from "cors";
import { Blockchain } from "./blockchain.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import pkg from "tweetnacl-util";
import axios from "axios";
const { decodeUTF8 } = pkg;
// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

const onGoingBlockChains: {
  id: string;
  publicKey: string;
  blockchain: Blockchain;
}[] = [];

// App configuration
const app = express();
app.use(cors());
app.use(express.json());
const server = createServer(app);
const io = new Server(server, {
  cors: {},
});

io.on("connection", (socket) => {
  socket.on("requestBlockchain", () => {
    // socket.broadcast.to("miners").emit("requestBlockchain");
    io.to("miners").emit("requestBlockchain");
  });

  socket.on("blockchain", (data) => {
    // i have the blockchain data let me send it to you
    io.to("miners").emit("blockchain", data);
    // socket.broadcast.to("miners").emit("blockchain", data);
  });
  socket.on("join_miners", () => {
    socket.join("miners");
  });

  socket.on("newBlock", (data) => {
    socket.broadcast.to("miners").emit("newBlock", data);
  });

  socket.on("transaction", (data) => {
    socket.broadcast.to("miners").emit("transaction", data);
  });
  const sendLatestBlockchain = () => {
    io.emit("on_going_block_chains", onGoingBlockChains);
  };
  socket.on(
    "myblockchain",
    ({
      id,
      blockchain,
      publicKey,
    }: {
      id: string;
      publicKey: string;
      blockchain: Blockchain;
    }) => {
      const index = onGoingBlockChains.findIndex((item) => item.id === id);
      if (index !== -1) {
        onGoingBlockChains[index] = {
          id,
          publicKey,
          blockchain,
        };
      } else {
        onGoingBlockChains.push({ id, publicKey, blockchain });
      }
      sendLatestBlockchain();
    }
  );

  socket.on("get_on_going_block_chains", () => {
    socket.emit("on_going_block_chains", onGoingBlockChains);
  });

  socket.on("disconnect", () => {
    const minerID = `${socket.id}`;

    // Find the index of the blockchain with the matching minerID
    const index = onGoingBlockChains.findIndex((item) => item.id === minerID);

    // If found, remove it from the array
    if (index !== -1) {
      onGoingBlockChains.splice(index, 1);
    }

    sendLatestBlockchain();
  });
  setTimeout(() => {
    firstTransaction();
  }, 1000);
});

// before starting out the proper lets first create the 3-4 dummy trnsactions

const createAccountFunction = (): {
  publicKey: string;
  secretKey: Uint8Array;
} => {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const path = `m/44'/501'/0'/0'`;
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
  const publicKey = Keypair.fromSecretKey(secretKey).publicKey.toBase58();
  return { publicKey, secretKey };
};

const mainAccount = createAccountFunction();

const secAccount = createAccountFunction();

let firsRunned = false;
const firstTransaction = () => {
  if (firsRunned) return;
  firsRunned = true;
  const baseTransaction = {
    amount: 100,
    from: Keypair.fromSecretKey(
      bs58.decode(process.env.SECRET_KEY || "")
    ).publicKey.toBase58(),
    to: secAccount.publicKey,
    timestamp: Date.now(),
  };

  const transaction = {
    ...baseTransaction,
    signature: bs58.encode(
      nacl.sign.detached(
        decodeUTF8(JSON.stringify(baseTransaction)),
        bs58.decode(process.env.SECRET_KEY || "")
      )
    ),
  };
  io.to("miners").emit("transaction", transaction);
};

app.post("/api/v1/send", async (req, res) => {
  io.to("miners").emit("transaction", req.body.transaction);
  const checkTransaction = async (signature: string) => {
    let response;
    do {
      response = await axios.get(
        `http://localhost:3000/transaction?signature=${signature}`
      );
      if (response.data) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500 ms before retrying
    } while (!response.data);

    return response;
  };

  const response = await checkTransaction(req.body.transaction.signature);
  if (response) {
    return res.status(200).json({
      status: "done",
    });
  } else {
    return res.status(500);
  }
});
app.get("/api/v1/airdrop", async (req, res) => {
  const publicKey = req.query.key;
  if (!PublicKey) {
    return res.status(404).json({
      message: "public key is required",
    });
  }
  const baseTransaction = {
    amount: 101,
    from: Keypair.fromSecretKey(
      bs58.decode(process.env.SECRET_KEY || "")
    ).publicKey.toBase58(),
    to: publicKey,
    timestamp: Date.now(),
  };

  const transaction = {
    ...baseTransaction,
    signature: bs58.encode(
      nacl.sign.detached(
        decodeUTF8(JSON.stringify(baseTransaction)),
        bs58.decode(process.env.SECRET_KEY || "")
      )
    ),
  };
  io.to("miners").emit("transaction", transaction);
  const checkTransaction = async (signature: string) => {
    let response;
    do {
      response = await axios.get(
        `http://localhost:3000/transaction?signature=${signature}`
      );
      if (response.data) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500 ms before retrying
    } while (!response.data);

    return response;
  };

  const response = await checkTransaction(transaction.signature);
  if (response) {
    return res.status(200).json({
      status: "done",
    });
  } else {
    return res.status(500);
  }
});

app.get("/api/v1/balance", async (req, res) => {
  const publicKey = req.query.key;
  if (!publicKey) {
    return res.status(404).json({
      message: "public key is required",
    });
  }
  const minerResponse = await axios(
    `http://localhost:3000/balance?key=${publicKey}`
  );
  return res.status(200).json({
    balance: minerResponse.data.balance,
  });
});

app.get("/api/v1/transactions", async (req, res) => {
  const publicKey = req.query.key;
  if (!publicKey) {
    return res.status(404).json({
      message: "public key is required",
    });
  }
  const minerResponse = await axios(
    `http://localhost:3000/transactions?publicKey=${publicKey}`
  );
  return res.status(200).json({
    transactions: minerResponse.data.transactions,
  });
});

server.listen(PORT, () => console.log(`Server is running at PORT ${PORT}`));
