import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000/");

export interface IBlock {
  seq: number;
  nonce: number;
  coinbase: {
    amount: number;
    to: string;
  };
  transactions: ITransaction[]; // Array of transactions
  prev: string; // Hash of the previous block
  hash: string; // Hash of the current block
}

export interface ITransaction {
  amount: number;
  from: string;
  to: string;
  seq: number;
  signature: string;
}

const Blockchain = () => {
  const [blockchains, setBlockchains] = useState<
    {
      id: string;
      blockchain: { chain: IBlock[] };
    }[]
  >([]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log(`connection success`);
    });

    socket.emit("get_on_going_block_chains");

    socket.on("on_going_block_chains", (data) => {
      // Check if the data is in the expected format
      console.log(data);
      if (Array.isArray(data)) {
        setBlockchains(data);
      } else {
        console.error("Received data is not in the expected format.");
      }
    });

    socket.onAny(() => {
      console.log(`any`);
    });
    // Clean up the socket connection when the component unmounts
    return () => {
      //   socket.off("connect");
      //   socket.off("on_going_block_chains");
    };
  }, []);

  const createTransaction = () => {
    const transaction = {
      amount: Math.random() * 1000,
      from: (Math.random() * 1000).toString(),
      to: (Math.random() * 1000).toString(),
      seq: 1, // Increment sequence number
      signature:
        "3046022100cf33ee8c696edd0b0c291a259e0a03ea2491f8febd396244e309d175bc8b6b7c022100a85b8b15e037ac42d9f2545e568d2433ede51e59f4bbfd4179f285fac1a10f66" +
        Math.random(),
    };
    socket.emit("transaction", transaction);
  };

  const RenderBlockChain = ({ blockchain }: { blockchain: IBlock[] }) => {
    return (
      <div className="grid">
        <div className="flex space-x-4 overflow-x-scroll ">
          {blockchain.map((block, index) => (
            <div
              key={index}
              className="border rounded-md p-3 bg-muted min-w-[33vh] shrink-0"
            >
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  Block:
                  <span className="border rounded p-1 flex-1 block bg-background">
                    {block.seq}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  Nonce:
                  <span className="border rounded p-1 flex-1 block bg-background">
                    {block.nonce}
                  </span>
                </p>
                <div>
                  <p>Transactions</p>
                  {block.transactions.map((transaction, index) => (
                    <div className="my-3" key={index}>
                      <p className="flex items-center gap-2">
                        SEQ:
                        <span className="border rounded p-1 flex-1 block bg-background">
                          {transaction.seq}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        amount:
                        <span className="border rounded p-1 flex-1 block bg-background">
                          {transaction.amount}
                        </span>
                      </p>{" "}
                      <p className="flex items-center gap-2">
                        From:
                        <span className="border rounded p-1 flex-1 block bg-background">
                          {transaction.from}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        To:
                        <span className="border rounded p-1 flex-1 block bg-background">
                          {transaction.to}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-2">
                  Prev:
                  <span className="border rounded p-1 flex-1 block bg-background">
                    {block.prev}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  Hash:
                  <span className="border rounded p-1 flex-1 block bg-background">
                    {block.hash}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container md:mt-12 mt-6">
      <h1 className="text-lg font-bold">Live Blockchain</h1>
      <Button onClick={createTransaction}>Create Transaction</Button>
      <div className="grid gap-12 mt-12">
        {blockchains.map((item, index: number) => (
          <div key={index}>
            <h2>
              {item.id}
              <br />
              Block length : {item.blockchain.chain.length}
            </h2>
            {Array.isArray(item.blockchain.chain) ? (
              <RenderBlockChain blockchain={item.blockchain.chain} />
            ) : (
              <p>Error: Blockchain data is not an array.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blockchain;
