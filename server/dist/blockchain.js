export class Transaction {
    amount;
    from;
    to;
    seq;
    signature;
    constructor({ amount, from, to, seq, signature }) {
        this.amount = amount;
        this.from = from;
        this.to = to;
        this.seq = seq;
        this.signature = signature;
    }
}
export class Block {
    seq;
    nonce;
    coinbase;
    transactions; // Fixed type from Block[] to Transaction[]
    prev;
    hash;
    constructor({ seq, coinbase, transactions, prev, hash = "", nonce = 0, }) {
        this.seq = seq;
        this.nonce = nonce;
        this.coinbase = coinbase;
        this.transactions = transactions;
        this.prev = prev;
        this.hash = hash;
    }
}
export class Blockchain {
    chain;
    constructor() {
        this.chain = [
            new Block({
                seq: 0,
                coinbase: { amount: 50, to: "genesisMiner" },
                transactions: [],
                prev: "000000000000000000000000000000000",
            }),
        ];
    }
}
