import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// le routeur (partie 1)
import { BrowserRouter } from "react-router-dom";
// l'authentification (partie 2, fichier du kit)
import { AuthProvider } from "./contexte/AuthContext";
import App from "./App.jsx";

// Rappel du TP4 : on "monte" <App /> dans la <div id="root"> de index.html.
// Nouveauté : deux FOURNISSEURS (providers) autour de <App />. Un fournisseur
// met quelque chose à disposition de TOUS les composants placés dedans.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 1. tout à l'extérieur : lire l'URL, naviguer */}
    <BrowserRouter>
      {/* 2. dedans : savoir qui est connecté (useAuth) */}
      <AuthProvider>
        {/* 3. l'application : tous ses composants profitent des deux */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
