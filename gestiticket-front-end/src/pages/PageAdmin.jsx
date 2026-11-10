// =============================================================================
// src/pages/PageAdmin.jsx — tableau de bord administrateur (KIT TP7, partie 3)
// -----------------------------------------------------------------------------
// TROIS FONCTIONS
//   1. lister / supprimer les utilisateurs   (GET puis DELETE /utilisateurs)
//   2. créer une catégorie                   (POST /categories)
//   3. créer un ticket                       (POST /tickets)
//
// LA RÈGLE DE TOUT LE TP7 : après chaque action réussie, on met l'ÉTAT à jour
// avec ce qu'on sait déjà (ou ce que l'API renvoie) — SANS recharger toute
// la liste. L'écran suit tout seul, et on économise des requêtes.
//
// SÉCURITÉ : cette page est protégée côté client (PrivateRoute adminRequis),
// mais c'est l'API qui protège VRAIMENT : chaque route admin exige un jeton
// d'administrateur (Auth::exigerAdmin → 403 sinon).
//
// Le chargement et tout l'affichage (JSX) sont fournis.
// Trois TODO à compléter dans gererSuppression, gererAjoutCategorie et
// gererAjoutTicket (repères TODO 1 à 3).
// =============================================================================
import { useState, useEffect } from "react";
import {
  getUtilisateurs,
  supprimerUtilisateur,
  getCategories,
  ajouterCategorie,
  ajouterTicket,
} from "../services/api";
import { useAuth } from "../contexte/AuthContext";

function PageAdmin() {
  // L'admin connecté : sert à ne pas afficher « Supprimer » sur sa propre ligne
  const { utilisateur } = useAuth();

  // ---- Les données affichées --------------------------------------------------
  const [utilisateurs, setUtilisateurs] = useState([]); // [] : liste vide au départ (TP5)
  const [categories, setCategories] = useState([]); // pour le menu du formulaire ticket

  // ---- Les messages -----------------------------------------------------------
  // Deux états séparés pour deux styles différents (App.css) :
  //   message → confirmation (.info)   |   erreur → message de l'API (.erreur)
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);

  // ---- Formulaire « Nouvelle catégorie » (formulaire contrôlé, TP6) -----------
  const [libelle, setLibelle] = useState("");
  // ATTENTION : un <select> manipule du TEXTE. '2' et non 2 (voir TODO 2).
  const [urgence, setUrgence] = useState("2");

  // ---- Formulaire « Nouveau ticket » ------------------------------------------
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [idCategorie, setIdCategorie] = useState(""); // '' = aucune catégorie choisie

  // ---------------------------------------------------------------------------
  // ÉTAPE 1 – CHARGEMENT : deux requêtes INDÉPENDANTES, lancées EN PARALLÈLE
  // avec Promise.all (comme tickets + catégories au TP5). [] : une seule fois,
  // à l'ouverture de la page.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function charger() {
      try {
        const [lesUtilisateurs, lesCategories] = await Promise.all([
          getUtilisateurs(), // route ADMIN : le jeton est joint par api.js
          getCategories(),
        ]);
        setUtilisateurs(lesUtilisateurs);
        setCategories(lesCategories);
      } catch (err) {
        setErreur(err.message); // ex. 403 si le compte n'est pas administrateur
      }
    }
    charger();
  }, []);

  // ---------------------------------------------------------------------------
  // ÉTAPE 2 – SUPPRIMER UN UTILISATEUR
  // ---------------------------------------------------------------------------
  async function gererSuppression(id, nomComplet) {
    // window.confirm : boîte de dialogue OK / Annuler du navigateur.
    // Annuler → false → on sort tout de suite (return).
    if (!window.confirm(`Supprimer ${nomComplet} et tous ses tickets ?`))
      return;
    setMessage(null);
    setErreur(null);
    try {
      // 1) côté serveur : DELETE /utilisateurs/:id (ses tickets partent avec,
      //    grâce au ON DELETE CASCADE écrit au TP1)
      await supprimerUtilisateur(id);
      // 2) côté écran : TODO 1, retirer l'utilisateur de l'état SANS recharger
      //   → setUtilisateurs((liste) => liste.filter((u) => ...));
      //     filter garde les éléments pour lesquels le test est VRAI :
      //     on garde tous ceux dont l'id est DIFFÉRENT de id.
      //     (Sans ce TODO, la suppression a bien lieu en base, mais la ligne
      //      reste affichée jusqu'au F5 : c'est l'écran qui ment.)
      setUtilisateurs((liste) => liste.filter((u) => u.id !== id));
      setMessage(`${nomComplet} a été supprimé.`);
    } catch (err) {
      setErreur(err.message); // ex. 400 « Impossible de supprimer son propre compte. »
    }
  }

  // ---------------------------------------------------------------------------
  // ÉTAPE 3 – CRÉER UNE CATÉGORIE
  // ---------------------------------------------------------------------------
  async function gererAjoutCategorie(e) {
    e.preventDefault(); // pas de rechargement de la page (TP6)
    setMessage(null);
    setErreur(null);
    try {
      // TODO 2 : a) l'urgence en NOMBRE, b) la catégorie créée ajoutée à l'état
      //   → a) le <select> renvoie "3" (texte), l'API exige 3 (entier) :
      //        convertissez urgence avec Number(...) dans l'appel ci-dessous ;
      const creee = await ajouterCategorie(libelle, Number(urgence));
      //     b) ajoutez la catégorie créée à l'état, sans recharger :
      setCategories((liste) => [...liste, creee]);
      //   Testez D'ABORD tel quel : l'API répond 400 (question 4 a).
      setLibelle(""); // on vide le champ
      setMessage(`Catégorie « ${creee.libelle} » créée.`);
    } catch (err) {
      setErreur(err.message); // ex. 409 « Cette categorie existe deja. » (doublon)
    }
  }

  // ---------------------------------------------------------------------------
  // ÉTAPE 4 – CRÉER UN TICKET
  // ---------------------------------------------------------------------------
  async function gererAjoutTicket(e) {
    e.preventDefault();
    setMessage(null);
    setErreur(null);
    try {
      // TODO 3 : idCategorie en NOMBRE
      //   → même piège qu'au TODO 2 : convertissez idCategorie (texte venu
      //     du <select>) avec Number(...) avant de l'envoyer.
      const cree = await ajouterTicket(titre, description, Number(idCategorie));
      setTitre("");
      setDescription("");
      // L'API renvoie le ticket créé, avec l'id attribué par la base
      setMessage(`Ticket n°${cree.id} « ${cree.titre} » créé.`);
    } catch (err) {
      setErreur(err.message);
    }
  }

  // ===========================================================================
  // L'AFFICHAGE
  // ===========================================================================
  return (
    <main className="contenu">
      <h2>Tableau de bord administrateur</h2>

      {/* Les messages n'existent que s'ils ne sont pas null (&&, TP5) */}
      {message && <p className="info">{message}</p>}
      {erreur && <p className="erreur">{erreur}</p>}

      {/* ---------- Les utilisateurs ---------- */}
      <section className="bloc-admin">
        <h3>Utilisateurs ({utilisateurs.length})</h3>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Tickets</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* Une ligne <tr> par utilisateur ; key = l'id en base */}
            {utilisateurs.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.prenom} {u.nom}
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                {/* nb_tickets : calculé par l'API (COUNT + LEFT JOIN, TP3) */}
                <td>{u.nb_tickets}</td>
                <td>
                  {/* Garde-fou : pas de bouton sur SA PROPRE ligne.
                      (L'API refuse de toute façon qu'un admin se supprime : 400.)
                      onClick : fonction fléchée, car il faut passer des
                      PARAMÈTRES (l'id et le nom) — sinon la fonction serait
                      exécutée pendant l'affichage. */}
                  {u.id !== utilisateur.id && (
                    <button
                      className="btn-supprimer"
                      onClick={() =>
                        gererSuppression(u.id, `${u.prenom} ${u.nom}`)
                      }
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Les deux formulaires côte à côte (grille CSS, App.css) */}
      <div className="grille-formulaires">
        {/* ---------- Nouvelle catégorie ---------- */}
        <section className="bloc-admin">
          <h3>Nouvelle catégorie</h3>
          <form className="form-admin" onSubmit={gererAjoutCategorie}>
            <label>
              Libellé
              <input
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                required
              />
            </label>
            <label>
              Niveau d'urgence
              {/* Un <select> contrôlé : value + onChange, comme un <input>.
                  Les value des <option> sont des CHAÎNES ("1" à "4"). */}
              <select
                value={urgence}
                onChange={(e) => setUrgence(e.target.value)}
              >
                <option value="1">1 – Faible</option>
                <option value="2">2 – Moyenne</option>
                <option value="3">3 – Élevée</option>
                <option value="4">4 – Critique</option>
              </select>
            </label>
            <button type="submit">Créer la catégorie</button>
          </form>
        </section>

        {/* ---------- Nouveau ticket ---------- */}
        <section className="bloc-admin">
          <h3>Nouveau ticket</h3>
          <form className="form-admin" onSubmit={gererAjoutTicket}>
            <label>
              Titre
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <label>
              Catégorie
              {/* Menu ALIMENTÉ PAR L'ÉTAT categories : une nouvelle catégorie
                  y apparaît dès qu'elle est ajoutée à l'état (étape 3).
                  La première option a la valeur "" : avec required, le
                  navigateur bloque l'envoi tant qu'on n'a rien choisi. */}
              <select
                value={idCategorie}
                onChange={(e) => setIdCategorie(e.target.value)}
                required
              >
                <option value="">-- choisir une catégorie --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Créer le ticket</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default PageAdmin;
