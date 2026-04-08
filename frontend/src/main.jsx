// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a24",
              color: "#f0eff8",
              border: "1px solid #2a2a3a",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#22d3a0", secondary: "#0a0a0f" } },
            error:   { iconTheme: { primary: "#f43f5e", secondary: "#0a0a0f" } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);