// =============================================================================
// src/composants/BarreNavigation.jsx — la barre sous l'en-tête (KIT TP6, PARTIE 4)
// -----------------------------------------------------------------------------
// Son contenu dépend de l'état de connexion, lu dans le CONTEXTE :
//   visiteur   : lien « Tickets » + lien « Connexion »
//   connecté   : lien « Tickets » + prénom nom (rôle) + bouton « Déconnexion »
// Elle est affichée dans App.jsx, hors de <Routes> : donc sur toutes les pages.
// Quand quelqu'un se connecte ou se déconnecte, setUtilisateur (AuthContext)
// déclenche un nouveau rendu : la barre se met à jour TOUTE SEULE.
// =============================================================================
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexte/AuthContext";

function BarreNavigation() {
  // On prend dans le contexte ce dont on a besoin : qui est connecté, et la
  // fonction pour se déconnecter.
  const { utilisateur, deconnexion } = useAuth();
  const naviguer = useNavigate();

  // Appelée par le bouton « Déconnexion »
  function gererDeconnexion() {
    deconnexion(); // vide localStorage et remet l'état à null (AuthContext)
    naviguer("/login"); // on quitte les pages protégées
  }

  return (
    // <nav> : balise sémantique d'une zone de navigation. Style : .navbar
    <nav className="navbar">
      {/* À gauche : les liens. <Link> change l'URL SANS recharger la page
          (navigation côté client). Un <a href> rechargerait toute
          l'application et effacerait l'état React. */}
      <div className="nav-liens">
        <Link to="/">Tickets</Link>
        {/* condition && <élément> (TP5) : le lien n'existe que si la condition
        est vraie. ?. (chaînage optionnel) évite une erreur quand
        utilisateur vaut null :
        utilisateur.role   → plante si utilisateur est null
        utilisateur?.role  → vaut undefined, pas d'erreur */}
        {utilisateur?.role === "admin" && (
          <Link to="/admin">Administration</Link>
        )}
        {utilisateur && <Link to="/profil">Mon profil</Link>}
      </div>

      {/* À droite : TODO, le contenu dépend de la connexion.
          Pour l'instant, toujours le lien « Connexion ».
          → remplacez ce lien par un TERNAIRE  {utilisateur ? ( A ) : ( B )}
            A (connecté) : un fragment <> ... </> contenant
                 <span className="nav-user">prénom nom (rôle)</span>
                 <button className="btn-deconnexion" onClick={gererDeconnexion}>Déconnexion</button>
            B (visiteur) : le <Link to="/login">Connexion</Link> actuel
          Le code complet est donné dans l'énoncé (partie 4 – étape 4). */}
      <div className="nav-droite">
        {/* Ternaire :  {condition ? ( si vrai ) : ( si faux )}
      utilisateur est un objet (vrai) ou null (faux) */}
        {utilisateur ? (
          // Connecté : DEUX éléments → un parent unique, le fragment <> </>
          <>
            <span className="nav-user">
              {utilisateur.prenom} {utilisateur.nom} ({utilisateur.role})
            </span>
            {/* onClick : la fonction SANS parenthèses (appelée au clic) */}
            <button className="btn-deconnexion" onClick={gererDeconnexion}>
              Déconnexion
            </button>
          </>
        ) : (
          // Visiteur : le lien vers la connexion
          <Link to="/login">Connexion</Link>
        )}
      </div>
    </nav>
  );
}

export default BarreNavigation;
