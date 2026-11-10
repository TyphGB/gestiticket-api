// src/composants/TicketCard.jsx - carte d'affichage d'un ticket
import { Link } from "react-router-dom";
// Les props arrivent dans un objet ; on les "destructure" entre accolades.
function TicketCard({ id, titre, categorie, urgence, statut }) {
  // TODO 1 : le libellé français du statut, calculé AVANT le return (ternaire)
  const libelleStatut =
    statut === "resolu"
      ? "Résolu"
      : statut === "en_cours"
        ? "En cours"
        : "Nouveau";

  return (
    <Link to={`/tickets/${id}`} className="carte-lien">
      <article className="carte-ticket">
        {/* TODO 2 : afficher le titre */}
        <h3>{titre}</h3>
        <p className="carte-infos">
          {/* TODO 3 : la classe du badge, `badge urgence-...` (gabarit de chaîne) */}
          <span className={`badge urgence-${urgence}`}>{categorie}</span>
          <span className={`statut statut-${statut}`}>{libelleStatut}</span>
        </p>
      </article>
    </Link>
  );
}

// Sans cette ligne, App.jsx ne pourra pas importer le composant
export default TicketCard;
