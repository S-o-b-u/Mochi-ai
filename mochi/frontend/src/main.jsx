import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import ContextProvider from "./context/Context.jsx";
import "./index.css";
import { neobrutalism } from "@clerk/themes";

// Get the publishable key from your environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: neobrutalism,
          variables: {
            colorPrimary: "#111",
            colorPrimaryForeground: "#fff",
            colorBackground: "#fff",
          },
        }}
      >
        <ContextProvider>
          <App />
        </ContextProvider>
      </ClerkProvider>
    </Router>
  </React.StrictMode>
);
