import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { googleClientId } from "@/config/env";
import { router } from "@/routes";
import "./index.css";

const app = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
) : (
  <RouterProvider router={router} />
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>
);
