import crypto from "crypto";
import {
  broadCastBlock,
  getMeBlockchain,
  sendUpdateBlockChainToServer,
} from "./index.js";
import { Mutex } from "async-mutex";

export interface ITransaction {
  amount: number;
  from: string;
  to: string;
  seq: number;
  signature: string;
}

export class Transaction implements ITransaction {
  amount: number;
  from: string;
  to: string;
  seq: number;
  signature: string;

  constructor({ amount, from, to, seq, signature }: ITransaction) {
    this.amount = amount;
    this.from = from;
    this.to = to;
    this.seq = seq;
    this.signature = signature;
  }
}

export class Block {
  seq: number;
  nonce: number;
  coinbase: {
    amount: number;
    to: string;
  };
  transactions: Transaction[]; // Fixed type from Block[] to Transaction[]
  prev: string;
  hash: string;

  constructor({
    seq,
    coinbase,
    transactions,
    prev,
    hash = "",
    nonce = 0,
  }: {
    seq: number;
    coinbase: { amount: number; to: string };
    transactions: Transaction[];
    prev: string;
    hash?: string;
    nonce?: number;
  }) {
    this.seq = seq;
    this.nonce = nonce;
    this.coinbase = coinbase;
    this.transactions = transactions;
    this.prev = prev;
    this.hash = hash;
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  printTransactions() {
    this.transactions.forEach((transaction) => {
      console.log(transaction);
    });
  }
  calculateHash(): string {
    const blockData = `${this.seq}${this.nonce}${JSON.stringify(
      this.coinbase
    )}${JSON.stringify(this.transactions)}${this.prev}`;
    return crypto.createHash("sha256").update(blockData).digest("hex");
  }

  mineBlock() {
    const target = "000";
    while (this.hash.substring(0, 3) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
  validateHash() {
    const blockData = `${this.seq}${this.nonce}${JSON.stringify(
      this.coinbase
    )}${JSON.stringify(this.transactions)}${this.prev}`;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(blockData)
      .digest("hex");
    return this.hash === calculatedHash;
  }
}

export class Blockchain {
  chain: Block[];
  private mutex: Mutex = new Mutex();
  constructor(initialChainData = []) {
    this.chain = [
      new Block({
        seq: 0,
        coinbase: { amount: 50, to: "genesisMiner" },
        transactions: [],
        prev: "0000000000000000000000000000000000000000", // Ensure the previous hash is of correct length
      }),
    ];
  }

  addTransaction(transaction: Transaction) {
    const latestBlock = this.getLatestBlock();
    if (latestBlock.transactions.length < 2 && !latestBlock.hash) {
      latestBlock.addTransaction(transaction);
    } else {
      this.addBlock(
        new Block({
          seq: latestBlock.seq + 1,
          coinbase: { amount: 50, to: "genesisMiner" },
          transactions: [transaction],
          prev: latestBlock.hash,
        })
      );
    }
  }
  async addBlock(newBlock: Block) {
    const latestBlock = this.getLatestBlock();

    if (process.env.PORT === `3000`) {
      // return;
      await new Promise<void>((res) => {
        setTimeout(() => {
          console.log(`Server delay simulated`);
          res();
        }, 3000);
      });
    }
    latestBlock.mineBlock();
    newBlock.prev = latestBlock.hash;
    if (latestBlock.hash) {
      await this.putBlockToChain(newBlock, true);
    }
  }

  async putBlockToChain(block: Block, broadcast: boolean = false) {
    // await this.mutex.runExclusive(async () => {
    const latestBlock = this.getLatestBlock();
    console.log(this.chain.length, `from head`);
    // If the latest block's hash matches the new block's previous hash
    if (latestBlock.hash === block.prev) {
      this.chain.push(block);
      if (broadcast) {
        broadCastBlock(block);
        console.log(`Block broadcasted successfully.`);
      }
    } else if (latestBlock.seq === block.seq && !latestBlock.hash) {
      this.chain[latestBlock.seq] = block;
    }
    // If the new block's sequence number is ahead, request the blockchain data
    else if (latestBlock.seq < block.seq) {
      console.log(latestBlock.seq, block.seq);
      getMeBlockchain();
    }
    console.log(this.chain.length);
    sendUpdateBlockChainToServer(this);
  }

  // Validate and add a block from the network
  async validateAndAddBlock(data: Block) {
    const newBlock = new Block(data);
    // console.log(`bhai hame to yeh ha `, this.getLatestBlock().seq);
    await this.putBlockToChain(newBlock, false);
  }
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  directAddBlock(block: Block) {
    this.chain.push(block);
  }
}
