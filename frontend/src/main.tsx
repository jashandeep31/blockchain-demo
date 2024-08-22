import * as React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Blockchain from "./pages/blockchain";
import ThemeProvider from "./providers/theme-provider";
import Home from "./pages/home";
import { Toaster } from "sonner";
import Account from "./pages/account";
import Navbar from "./components/navbar";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/blockchain",
    element: <Blockchain />,
  },
  {
    path: "/:publicKey",
    element: <Account />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Toaster richColors />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 ">
          <RouterProvider router={router} />
        </div>
        <footer className="py-3 border-t mt-12">
          <div className="container">
            <a href="https://x.com/Jashandeep31">@jashandeep31</a>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  </React.StrictMode>
);
