// =============================================================================
// App.jsx — Composant racine de GestiTicket (KIT DE DÉMARRAGE TP6)
// -----------------------------------------------------------------------------
// CE QUI CHANGE AU TP6
//   Au TP5, App.jsx contenait toute la liste des tickets. Ce contenu a été
//   DÉPLACÉ dans src/pages/PageTickets.jsx (partie 1 – étape 2).
//   Désormais, App ne fait plus qu'une chose : choisir QUEL ÉCRAN afficher
//   selon l'URL. C'est le rôle de <Routes> et <Route> (React Router).
//
// RAPPEL : une SPA n'a qu'UNE page HTML (index.html). Les "pages" sont des
// composants que React Router échange selon l'URL, sans jamais redemander
// de page au serveur. Résultat : instantané, et l'état est conservé.
//
// ORGANISATION DES DOSSIERS
//   src/pages/       un fichier par ÉCRAN (PageTickets, PageLogin, PageAdmin)
//   src/composants/  les BRIQUES réutilisables (Header, TicketCard, ...)
//
// Les repères « PARTIE 4 » vous indiquent où intervenir plus tard.
// =============================================================================

// Routes, Route, Navigate : exports NOMMÉS de la bibliothèque installée avec
//   npm install react-router-dom
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./composants/Header";
// PARTIE 4 – étape 4 : importez ici BarreNavigation.
import BarreNavigation from "./composants/BarreNavigation";
// PARTIE 4 – étape 3 : importez ici PrivateRoute et PageAdmin.
import PrivateRoute from "./composants/PrivateRoute";
import PageAdmin from "./pages/PageAdmin";

// Les écrans : chemin './pages/...' (le dossier créé à la partie 1)
import PageTickets from "./pages/PageTickets";
import PageLogin from "./pages/PageLogin";
import PageTicketDetail from "./pages/PageTicketDetail";
import PageProfil from "./pages/PageProfil";
import "./App.css";

function App() {
  return (
    <>
      {/* Tout ce qui est HORS de <Routes> s'affiche sur TOUTES les pages. */}
      <Header />
      {/* PARTIE 4 – étape 4 : affichez ici <BarreNavigation /> */}
      <BarreNavigation />
      {/* <Routes> regarde l'URL et affiche UNE SEULE <Route> : celle dont le
          path correspond. Les <Route> sont des "règles" :  URL → composant. */}
      <Routes>
        {/* element attend du JSX : element={<PageTickets />}
            (et NON element={PageTickets}, qui serait la fonction elle-même) */}
        <Route path="/" element={<PageTickets />} />
        <Route path="/login" element={<PageLogin />} />

        {/* PARTIE 4 – étape 3 : déclarez ici la route /admin, protégée par
            PrivateRoute (le code est donné dans l'énoncé). */}
        <Route
          path="/admin"
          element={
            // adminRequis écrite seule = adminRequis={true}
            <PrivateRoute adminRequis>
              {" "}
              {/* le "videur" : affiche ou redirige */}
              <PageAdmin /> {/* devient la prop children de PrivateRoute */}
            </PrivateRoute>
          }
        />
        {/* ":id" est un PARAMÈTRE : cette seule règle couvre /tickets/1, /tickets/2... */}
        <Route path="/tickets/:id" element={<PageTicketDetail />} />

        <Route
          path="/profil"
          element={
            <PrivateRoute>
              <PageProfil />
            </PrivateRoute>
          }
        />
        {/* path="*" : toute URL qui ne correspond à AUCUNE route ci-dessus.
            On la place EN DERNIER. <Navigate> redirige vers l'accueil ;
            replace : l'URL inconnue ne reste pas dans l'historique (le bouton
            « Précédent » ne reboucle pas dessus). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
