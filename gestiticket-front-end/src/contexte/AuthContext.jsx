// =============================================================================
// src/contexte/AuthContext.jsx — qui est connecté ? (KIT TP6, PARTIE 2)
// -----------------------------------------------------------------------------
// LE PROBLÈME
//   L'utilisateur connecté doit être connu PARTOUT : barre de navigation,
//   pages protégées, page de login... Le transmettre en props d'étage en
//   étage obligerait chaque composant intermédiaire à le recevoir et le
//   retransmettre, même s'il ne s'en sert pas.
//
// LA SOLUTION : un CONTEXTE, qui DIFFUSE une donnée à toute l'application.
//   - AuthProvider : le "diffuseur", placé autour de <App /> dans main.jsx ;
//   - useAuth()    : le "récepteur", utilisable dans n'importe quel composant :
//                      const { utilisateur } = useAuth();
//   Image : la sonorisation du lycée. On diffuse une fois, chaque salle entend.
//
// DEUX STOCKAGES, DEUX RÔLES (à savoir expliquer — question 2)
//   - useState     : rafraîchit l'écran quand la valeur change (RÉACTIVITÉ),
//                    mais tout est perdu au rechargement de la page (F5) ;
//   - localStorage : conserve l'information dans le navigateur (PERSISTANCE),
//                    même après F5 ou fermeture de l'onglet, mais ne prévient
//                    personne quand elle change.
//   On utilise donc LES DEUX ensemble, et on les garde synchronisés.
//
// Six lignes sont à écrire (TODO 1 à 6). Tant qu'elles ne le
// sont pas, VS Code souligne setUtilisateur (« jamais utilisé ») : c'est normal.
// =============================================================================
import { createContext, useContext, useState } from "react";
// "as" renomme à l'import : login devient loginApi dans ce fichier, pour ne
// pas confondre l'appel réseau avec notre fonction connexion() ci-dessous.
import { login as loginApi } from "../services/api";

// 1. LE CONTEXTE : une "boîte" vide (null), remplie plus bas par le fournisseur.
const AuthContext = createContext(null);

// 2. LE FOURNISSEUR : un composant comme un autre, qui enveloppe l'application.
//    children = tout ce qui est placé entre <AuthProvider> et </AuthProvider>
//    dans main.jsx (ici : <App />). On l'affiche tel quel, entouré du Provider.
export function AuthProvider({ children }) {
  // L'utilisateur connecté : un objet { id, nom, prenom, email, role },
  // ou null si personne n'est connecté.
  // INITIALISATION PARESSEUSE : on passe une FONCTION à useState. Elle n'est
  // exécutée qu'au tout premier rendu, pour calculer la valeur de départ :
  // on relit localStorage → on reste connecté après un F5.
  const [utilisateur, setUtilisateur] = useState(() => {
    const stocke = localStorage.getItem("utilisateur"); // texte JSON, ou null
    // localStorage ne stocke que du TEXTE : JSON.parse le reconvertit en objet.
    return stocke ? JSON.parse(stocke) : null;
  });

  // ---------------------------------------------------------------------------
  // connexion(email, motDePasse) : appelée par le formulaire de PageLogin.
  // async : elle attend la réponse de l'API.
  // ---------------------------------------------------------------------------
  async function connexion(email, motDePasse) {
    // Si l'API répond 401 (identifiants incorrects), loginApi LÈVE une
    // exception. On ne l'attrape pas ici : elle "remonte" jusqu'au catch de
    // PageLogin, qui affichera le message. (Pas de try/catch = on laisse passer.)
    const data = await loginApi(email, motDePasse);

    // Arrivé ici, la connexion a réussi. L'API a répondu :
    //   { jeton: "eyJ...", utilisateur: { id, nom, prenom, email, role } }
    // TODO 1 : persistance du jeton
    //   → rangez data.jeton dans localStorage, sous la clé 'jeton'
    //     (c'est là que api.js ira le chercher pour chaque requête)
    localStorage.setItem("jeton", data.jeton);
    // TODO 2 : objet → texte
    //   → rangez data.utilisateur dans localStorage, sous la clé 'utilisateur'
    //     (localStorage ne stocke que du TEXTE : JSON.stringify(...) obligatoire)
    localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
    // TODO 3 : réactivité (l'écran suit)
    //   → mettez à jour l'état avec setUtilisateur(...)
    //     (sinon l'écran ne saura pas que quelqu'un est connecté)
    setUtilisateur(data.utilisateur);

    // On renvoie l'utilisateur au formulaire : il en a besoin pour choisir
    // la redirection selon le rôle (admin → /admin, sinon → /).
    return data.utilisateur;
  }

  // ---------------------------------------------------------------------------
  // deconnexion() : on oublie tout CÔTÉ CLIENT.
  // Le serveur, lui, n'a rien à faire : il ne stocke aucune session (JWT
  // stateless, TP3). Sans jeton, les requêtes protégées recevront un 401.
  // ---------------------------------------------------------------------------
  function deconnexion() {
    // TODO 4 : plus de jeton envoyé
    //   → supprimez la clé 'jeton' de localStorage (removeItem)
    localStorage.removeItem("jeton");
    // TODO 5 : plus de reconnexion au F5
    //   → supprimez la clé 'utilisateur' de localStorage
    localStorage.removeItem("utilisateur");
    // TODO 6 : l'écran repasse en "visiteur"
    //   → remettez l'état à null
    setUtilisateur(null);
  }

  // Appelée par PageProfil avec l'utilisateur renvoyé par l'API (TP7).
  // On met à jour LES DEUX stockages (comme connexion() au TP6) :
  function rafraichirUtilisateur(nouvelUtilisateur) {
    // survit au F5
    localStorage.setItem("utilisateur", JSON.stringify(nouvelUtilisateur));
    // rafraîchit l'écran
    setUtilisateur(nouvelUtilisateur);
  }
  // 3. value = ce que TOUS les composants pourront lire avec useAuth().
  //    Les doubles accolades : les premières pour "du JavaScript dans le JSX",
  //    les secondes pour l'OBJET { utilisateur, connexion, deconnexion }.
  return (
    <AuthContext.Provider
      value={{ utilisateur, connexion, deconnexion, rafraichirUtilisateur }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 4. LE RACCOURCI : un "hook personnalisé". Au lieu d'écrire partout
//      useContext(AuthContext)
//    on écrit :  const { utilisateur, connexion, deconnexion } = useAuth();
//    ATTENTION : useAuth() ne fonctionne qu'À L'INTÉRIEUR de <AuthProvider>
//    (sinon il renvoie null → erreur « Cannot destructure property... »).
// La ligne eslint-disable évite un avertissement de Vite sans importance :
// ce fichier exporte un composant ET une fonction.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
