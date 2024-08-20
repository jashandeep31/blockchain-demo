import * as React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Blockchain from "./pages/blockchain";
import ThemeProvider from "./providers/theme-provider";
import Home from "./pages/home";
import { Toaster } from "sonner";
import Account from "./pages/account";

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
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
