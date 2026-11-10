// =============================================================================
// src/pages/PageTicketDetail.jsx — le détail d'un ticket (KIT TP7, parties 1 et 2)
// -----------------------------------------------------------------------------
// Route déclarée dans App.jsx :  <Route path="/tickets/:id" ... />
// L'URL /tickets/3 affiche le ticket n°3, ses interventions, et (si l'on est
// connecté et que le ticket n'est pas clos) un formulaire pour intervenir.
//
// DEUX PATRONS DÉJÀ CONNUS, RÉUTILISÉS ICI
//   - TP5 : les trois états d'un chargement (donnée, chargement, erreur)
//           et leur useEffect ;
//   - TP6 : le formulaire contrôlé (value + onChange) et preventDefault.
// NOUVEAUTÉS : useParams (lire l'URL), [id] dans les dépendances, la case à
// cocher (checked), et la mise à jour de l'état avec la réponse de l'API.
//
// Deux TODO à compléter : TODO 1 (partie 1) et TODO 2 (partie 2).
// Tout le reste est fourni : lisez-le attentivement.
//
// LE CYCLE DE VIE DE CETTE PAGE, EN RÉSUMÉ
//   1. Premier rendu : chargement = true → on affiche « Chargement… ».
//   2. Après ce premier affichage, React exécute le useEffect → appel à l'API.
//   3. La réponse arrive : setTicket(...) et setChargement(false).
//   4. Chaque set... déclenche un NOUVEAU rendu : cette fois le ticket s'affiche.
//   5. L'utilisateur envoie une intervention → setTicket(...) → nouveau rendu
//      avec la liste à jour. Pas besoin de recharger la page !
// À retenir : un composant React est une FONCTION rappelée à chaque
// changement d'état. Tout le code ci-dessous est donc ré-exécuté à chaque rendu
// (sauf le contenu du useEffect, qui ne tourne que quand [id] change).
// =============================================================================

// --- Les imports -------------------------------------------------------------
// useState  : donner une "mémoire" au composant (une variable qui survit entre
//             deux rendus et qui, quand on la modifie, provoque un nouveau rendu).
// useEffect : lancer un "effet de bord" (ici un appel réseau) APRÈS l'affichage.
import { useState, useEffect } from "react";
// useParams : lire les morceaux variables de l'URL (le ":id" de la route).
// Link      : un lien qui change de page SANS recharger le navigateur.
import { useParams, Link } from "react-router-dom";
// Nos fonctions d'appel à l'API (fetch caché dedans) : le composant ne sait pas
// COMMENT on parle au serveur, il demande juste « donne-moi le ticket ».
// C'est une séparation des responsabilités : affichage ici, réseau là-bas.
import { getUnTicket, intervenir } from "../services/api";
// useAuth : notre hook maison qui lit le contexte d'authentification (TP6).
// Il évite de faire passer "utilisateur" en props à travers tous les composants.
import { useAuth } from "../contexte/AuthContext";

// Un composant = une fonction dont le nom commence par une MAJUSCULE
// (c'est comme ça que JSX distingue <PageTicketDetail /> d'une balise HTML).
function PageTicketDetail() {
  // ===========================================================================
  // 1. LES HOOKS — toujours EN HAUT du composant, jamais dans un if ou une boucle
  //    (React les reconnaît par leur ORDRE d'appel : il doit rester identique
  //    à chaque rendu).
  // ===========================================================================

  // useParams() lit les paramètres déclarés dans la route (":id")
  // URL /tickets/3  →  useParams() renvoie { id: "3" }  →  on "déstructure"
  // ATTENTION : id est une CHAÎNE ('3'), pas un nombre
  // (si un jour vous comparez, écrivez Number(id) === 3, pas id === 3).
  const { id } = useParams();

  // Qui est connecté ? null pour un visiteur (sert à choisir quoi afficher en bas)
  // Même syntaxe de déstructuration : useAuth() renvoie un objet, on n'en garde
  // que la propriété "utilisateur".
  const { utilisateur } = useAuth();

  // Les trois états du TP5. ticket vaut null tant qu'il n'est pas arrivé
  // (ici on attend UN objet, pas une liste : null est le bon "rien").
  // Rappel de la syntaxe : useState(valeurInitiale) renvoie un tableau de deux
  // éléments [laValeur, laFonctionPourLaChanger], qu'on déstructure.
  const [ticket, setTicket] = useState(null);
  // true dès le départ : au tout premier rendu, on est forcément en train de charger.
  const [chargement, setChargement] = useState(true);
  // null = pas d'erreur. Sinon on y range le message à afficher.
  const [erreur, setErreur] = useState(null);

  // Les états du formulaire d'intervention (partie 2) : un par champ
  // C'est le principe du "champ contrôlé" : la VÉRITÉ est dans l'état React,
  // le <textarea> ne fait qu'afficher ce que l'état contient.
  const [contenu, setContenu] = useState(""); // le texte de l'intervention
  const [cloture, setCloture] = useState(false); // la case à cocher : un BOOLÉEN

  // ---------------------------------------------------------------------------
  // CHARGEMENT DU TICKET (patron du TP5)
  // Dépendances [id] et non [] : l'effet se RELANCE quand l'id de l'URL change.
  // Pourquoi ? En passant de /tickets/1 à /tickets/2, React Router RÉUTILISE
  // ce même composant (il n'est pas recréé). Avec [], l'effet ne se relancerait
  // jamais : l'URL changerait mais l'écran garderait le ticket 1 (question 1).
  //
  // Pourquoi une fonction charger() À L'INTÉRIEUR de l'effet ?
  // La fonction passée à useEffect ne peut PAS être async elle-même (elle doit
  // renvoyer rien ou une fonction de nettoyage, pas une Promesse). On déclare
  // donc une fonction async à l'intérieur, puis on l'appelle tout de suite.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function charger() {
      // try / catch / finally : la gestion d'erreur des fonctions async.
      //   try     → le chemin normal ;
      //   catch   → si une ligne du try lève une erreur (réseau, 404, 500…) ;
      //   finally → exécuté DANS TOUS LES CAS, succès ou échec.
      try {
        // getUnTicket renvoie le ticket ET ses interventions (TP2/TP3)
        // await : on attend la réponse du serveur avant de passer à la suite.
        // Sans await, setTicket recevrait une Promesse, pas le ticket !
        setTicket(await getUnTicket(id));
        setErreur(null); // on efface une éventuelle erreur précédente
      } catch (err) {
        setErreur(err.message); // ex. 404 « Le ticket 99 n'existe pas. »
      } finally {
        // Dans finally : que ça ait marché ou non, le chargement est TERMINÉ.
        // (Sinon, en cas d'erreur, on resterait bloqué sur « Chargement… ».)
        setChargement(false);
      }
    }
    charger();
  }, [id]); // ← la liste de ce qui, en changeant, doit relancer l'effet

  // ---------------------------------------------------------------------------
  // ENVOI D'UNE INTERVENTION (partie 2) — première ÉCRITURE en base depuis React
  // Jusqu'ici on ne faisait que LIRE (GET). Ici on ÉCRIT (POST) : le serveur
  // enregistre l'intervention en base, puis nous renvoie le ticket à jour.
  //
  // Le paramètre e est l'ÉVÉNEMENT "submit" fourni par le navigateur.
  // ---------------------------------------------------------------------------
  async function gererIntervention(e) {
    e.preventDefault(); // pas de rechargement de la page (TP6)
    // (Par défaut, un <form> HTML recharge la page à l'envoi : on perdrait
    //  tout l'état React. preventDefault() annule ce comportement.)
    try {
      // TODO 2 : envoyer l'intervention, puis mettre l'état à jour
      //   → a) appelez intervenir(id, contenu, cloture) et rangez la réponse
      //        dans une constante ticketAJour (n'oubliez pas await) ;
      const ticketAJour = await intervenir(id, contenu, cloture);
      //     b) l'API renvoie le ticket COMPLET mis à jour : remplacez l'état
      //        avec setTicket(ticketAJour).
      setTicket(ticketAJour);
      //   Tant que ce TODO n'est pas fait, VS Code souligne intervenir
      //   (importé mais pas encore utilisé). C'est normal.
      //
      //   Pourquoi remplacer TOUT le ticket plutôt qu'ajouter l'intervention
      //   à la main dans la liste ? Parce que le serveur est la SOURCE DE VÉRITÉ :
      //   si la case "résout le ticket" était cochée, le STATUT a changé aussi.
      //   En reprenant sa réponse telle quelle, l'écran est forcément juste.
      setContenu(""); // on vide le formulaire...
      setCloture(false); // ...et on décoche la case
      // (Ces deux lignes sont DANS le try, après l'envoi : si l'envoi échoue,
      //  on ne vide pas le formulaire et l'utilisateur ne perd pas son texte.)
    } catch (err) {
      setErreur(err.message); // ex. 401 si le jeton a expiré
    }
  }

  // ---------------------------------------------------------------------------
  // RETOURS ANTICIPÉS : on traite les cas particuliers AVANT l'affichage normal.
  // Indispensable : tant que ticket vaut null, écrire ticket.titre planterait.
  // (Erreur JavaScript : « Cannot read properties of null (reading 'titre') ».)
  // L'ORDRE compte : chargement d'abord, puis erreur, puis absence de donnée.
  // Ces if sont placés APRÈS tous les hooks : un return avant un hook ferait
  // varier le nombre de hooks d'un rendu à l'autre, ce que React interdit.
  // ---------------------------------------------------------------------------
  if (chargement)
    return (
      <main className="contenu">
        <p className="info">Chargement…</p>
      </main>
    );
  if (erreur)
    return (
      <main className="contenu">
        <p className="erreur">{erreur}</p>
      </main>
    );
  if (!ticket) return null; // null : React n'affiche rien

  // À partir d'ici, on est CERTAIN que ticket est un vrai objet : on peut
  // utiliser ticket.titre, ticket.interventions… sans risque.

  // Même traduction du statut qu'au TP4 (TicketCard)
  // La base stocke des codes techniques ('en_cours'), l'écran affiche du
  // français lisible ('En cours'). Ternaire en cascade : condition ? si_vrai : sinon.
  const libelleStatut =
    ticket.statut === "resolu"
      ? "Résolu"
      : ticket.statut === "en_cours"
        ? "En cours"
        : "Nouveau";

  // ===========================================================================
  // 2. L'AFFICHAGE (JSX)
  // Rappels JSX : className (et non class), les accolades { } insèrent du
  // JavaScript dans le HTML, les commentaires s'écrivent {/* ... */}.
  // ===========================================================================
  return (
    <main className="contenu">
      {/* <Link> : retour à la liste sans recharger la page (TP6) */}
      {/* (Un <a href="/"> marcherait aussi, mais rechargerait TOUTE l'appli
          et ferait perdre l'état en mémoire.) */}
      <Link to="/" className="lien-retour">
        ← Retour aux tickets
      </Link>

      {/* ---------- Le ticket ---------- */}
      <article className="detail-ticket">
        <div className="detail-entete">
          <h2>{ticket.titre}</h2>
          {/* Même badge coloré que TicketCard : ici le champ s'appelle
              directement niveau_urgence, puisqu'on lit l'objet de l'API */}
          {/* Les backquotes `...` forment un "template literal" : ${...}
              insère une valeur. urgence-3 → la classe CSS "urgence-3". */}
          <span className={`badge urgence-${ticket.niveau_urgence}`}>
            {ticket.categorie}
          </span>
        </div>
        {/* Même astuce : statut-en_cours, statut-resolu… chaque statut a sa couleur en CSS */}
        <p>
          Statut :{" "}
          <span className={`statut statut-${ticket.statut}`}>
            {libelleStatut}
          </span>
        </p>
        <p>{ticket.description}</p>
      </article>

      {/* ---------- Les interventions ---------- */}
      {/* .length : le nombre d'éléments du tableau, affiché entre parenthèses */}
      <h3>Interventions ({ticket.interventions.length})</h3>
      {/* Ternaire : un message si la liste est vide, sinon la liste */}
      {ticket.interventions.length === 0 ? (
        <p className="info">Aucune intervention pour l'instant.</p>
      ) : (
        <ul className="liste-interventions">
          {/* Un <li> par intervention ; key = l'id de l'intervention en base */}
          {/* .map() transforme un tableau de DONNÉES en tableau d'ÉLÉMENTS JSX.
              key aide React à savoir quel <li> correspond à quelle donnée quand
              la liste change (ajout d'une intervention) : il doit être UNIQUE
              et STABLE, d'où l'id de la base (et pas l'index du tableau). */}
          {ticket.interventions.map((i) => (
            <li key={i.id} className="intervention">
              <p>{i.contenu}</p>
              {/* prenom et nom viennent d'une JOINTURE SQL côté API
                  (table interventions + table utilisateurs) */}
              <p className="intervention-meta">
                par {i.prenom} {i.nom}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Le bas de page : TROIS situations ----------
          Ternaire "en cascade" (comme le statut au TP4) :
            visiteur (pas de jeton)  → lien vers la connexion
            ticket déjà résolu       → message "clos"
            sinon                    → le formulaire
          (L'API refuserait de toute façon une intervention sans jeton : 401.)
          Masquer le formulaire relève du CONFORT de l'utilisateur ; la vraie
          SÉCURITÉ est côté serveur. Ne jamais compter sur le front seul ! */}
      {!utilisateur ? (
        <p className="info">
          <Link to="/login">Connectez-vous</Link> pour intervenir.
        </p>
      ) : ticket.statut === "resolu" ? (
        <p className="info">Ce ticket est clos.</p>
      ) : (
        // onSubmit sur le <form> (et pas onClick sur le bouton) : ainsi la
        // touche Entrée et l'attribut required fonctionnent aussi.
        // On passe la fonction SANS parenthèses : onSubmit={gererIntervention}
        // (avec des parenthèses, elle s'exécuterait immédiatement au rendu).
        <form className="form-intervention" onSubmit={gererIntervention}>
          <h3>Ajouter une intervention</h3>
          {/* Champ contrôlé (TP6) : value + onChange */}
          {/* À chaque frappe : onChange → setContenu(nouveau texte) → nouveau
              rendu → le textarea affiche la nouvelle valeur de contenu.
              required : le navigateur bloque l'envoi si le champ est vide. */}
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Décrivez ce que vous avez fait…"
            required
          />
          {/* UNE CASE À COCHER SE PILOTE AVEC checked, PAS value :
                checked={cloture}                 la case affiche le booléen
                e.target.checked                  true / false au clic
              (e.target.value vaudrait toujours "on" : piège classique) */}
          {/* Le <label> qui ENTOURE l'input : cliquer sur le texte coche aussi
              la case (plus grande zone cliquable, meilleure accessibilité). */}
          <label className="case-cloture">
            <input
              type="checkbox"
              checked={cloture}
              onChange={(e) => setCloture(e.target.checked)}
            />
            Cette intervention résout le ticket
          </label>
          {/* type="submit" : ce bouton déclenche l'événement onSubmit du form */}
          <button type="submit">Envoyer</button>
        </form>
      )}
    </main>
  );
}

// export default : ce composant est ce que les autres fichiers récupèrent avec
// import PageTicketDetail from './pages/PageTicketDetail' (ici dans App.jsx).
export default PageTicketDetail;
