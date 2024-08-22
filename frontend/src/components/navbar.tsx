import React from "react";

const Navbar = () => {
  return (
    <div className="border-b ">
      <div className="container py-3 flex gap-6">
        <h1 className="text-lg font-bold">
          <a href="/">BTx Coin</a>
        </h1>
        <div className="flex gap-6 items-center">
          <nav>
            <a
              className="text-sm text-muted-foreground hover:text-foreground hover:duration-300"
              href={"/"}
            >
              Home
            </a>
          </nav>
          <nav>
            <a
              className="text-sm text-muted-foreground hover:text-foreground hover:duration-300 flex items-center gap-2"
              href={"/blockchain"}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>{" "}
              Live Blockchain
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
