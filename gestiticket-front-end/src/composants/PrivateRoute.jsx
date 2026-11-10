// =============================================================================
// src/composants/PrivateRoute.jsx — le "videur" des pages protégées (KIT TP6, PARTIE 4)
// -----------------------------------------------------------------------------
// UN COMPOSANT QUI NE DESSINE RIEN : IL DÉCIDE.
//   - personne n'est connecté → redirection vers /login
//   - quelqu'un est connecté  → on affiche la page demandée (children)
//
// children = ce qui est placé ENTRE <PrivateRoute> et </PrivateRoute> :
//     <PrivateRoute>
//       <PageAdmin />        ← c'est "children"
//     </PrivateRoute>
//
// ⚠ À RETENIR : PrivateRoute améliore l'EXPÉRIENCE,
// il ne SÉCURISE rien. Ce code s'exécute dans le navigateur de l'utilisateur,
// qui peut le contourner (ou appeler l'API directement avec Thunder Client).
// La sécurité réelle est côté serveur : l'API vérifie le jeton (401) et le
// rôle (403) à CHAQUE requête. "Le client propose, le serveur dispose."
// =============================================================================
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexte/AuthContext";

function PrivateRoute({ children, adminRequis = false }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return <Navigate to="/login" replace />;
  }

  if (adminRequis && utilisateur.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
export default PrivateRoute;
