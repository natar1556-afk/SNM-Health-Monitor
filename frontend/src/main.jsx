import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppProviders = () => (
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);

const Root = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <AppProviders />
  </GoogleOAuthProvider>
) : (
  <AppProviders />
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{Root}</React.StrictMode>
);
