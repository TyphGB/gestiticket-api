// =============================================================================
// src/pages/PageProfil.jsx — modifier ses propres informations (KIT TP7, partie 4)
// -----------------------------------------------------------------------------
// Route /profil, protégée par PrivateRoute : utilisateur n'est jamais null ici.
// Le formulaire est PRÉ-REMPLI avec les informations de l'utilisateur
// connecté, lues dans le contexte (TP6).
//
// CE QUI SE PASSE À L'ENVOI
//   1. on construit l'objet infos (le mot de passe SEULEMENT s'il est saisi) ;
//   2. PUT /utilisateurs/:id → l'API renvoie l'utilisateur à jour ;
//   3. on transmet cet utilisateur au CONTEXTE (rafraichirUtilisateur) :
//      la barre de navigation affiche aussitôt le nouveau nom, et localStorage
//      garde la modification après un F5.
//
// Prérequis : rafraichirUtilisateur ajouté dans AuthContext.jsx (partie 4 – étape 1).
// Deux TODO à compléter dans gererEnvoi (repères TODO 1 et TODO 2).
// =============================================================================
import { useState } from "react";
import { modifierProfil } from "../services/api";
import { useAuth } from "../contexte/AuthContext";

function PageProfil() {
  // utilisateur : les infos actuelles ; rafraichirUtilisateur : pour mettre
  // à jour le contexte après modification (fonction ajoutée au TP7).
  const { utilisateur, rafraichirUtilisateur } = useAuth();

  // VALEURS DE DÉPART = celles de l'utilisateur connecté : le formulaire
  // s'ouvre pré-rempli. (La valeur passée à useState ne sert qu'au 1er rendu.)
  const [nom, setNom] = useState(utilisateur.nom);
  const [prenom, setPrenom] = useState(utilisateur.prenom);
  const [email, setEmail] = useState(utilisateur.email);
  // Le mot de passe, lui, part VIDE : on ne connaît pas l'ancien (l'API ne
  // stocke qu'un hachage, TP3), et vide signifie « ne pas le changer ».
  const [motDePasse, setMotDePasse] = useState("");

  const [message, setMessage] = useState(null); // confirmation
  const [erreur, setErreur] = useState(null); // message de l'API

  async function gererEnvoi(e) {
    e.preventDefault();
    setMessage(null);
    setErreur(null);
    try {
      // Les trois champs obligatoires pour l'API (PUT /utilisateurs/:id)
      const infos = { nom, prenom, email }; // raccourci de { nom: nom, ... }

      // TODO 1 : le mot de passe, QUE s'il a été saisi
      if (motDePasse !== "") infos.mot_de_passe = motDePasse;
      //     (mot_de_passe : le nom attendu par l'API, en snake_case)

      // PUT /utilisateurs/:id → l'API renvoie l'utilisateur mis à jour
      // (403 si on essayait de modifier le compte de quelqu'un d'autre)
      const utilisateurAJour = await modifierProfil(utilisateur.id, infos);
      // TODO 2 : la réponse transmise au contexte (état + localStorage)
      rafraichirUtilisateur(utilisateurAJour);
      //     (la barre de navigation se mettra à jour)
      setMotDePasse(""); // on vide le champ mot de passe
      setMessage("Profil mis à jour.");
    } catch (err) {
      setErreur(err.message); // ex. 400 « L'adresse email est invalide. »
    }
  }

  return (
    <main className="contenu">
      {/* Même mise en forme que la page de connexion (classe carte-login, TP6) */}
      <form className="carte-login" onSubmit={gererEnvoi}>
        <h2>Mon profil</h2>
        {message && <p className="info">{message}</p>}
        {erreur && <p className="erreur">{erreur}</p>}

        {/* Quatre champs contrôlés : value + onChange (TP6) */}
        <label>
          Nom
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </label>
        <label>
          Prénom
          <input
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Nouveau mot de passe (laisser vide pour ne pas le changer)
          {/* PAS de required : le champ peut rester vide */}
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>

        <button type="submit">Enregistrer</button>
      </form>
    </main>
  );
}

export default PageProfil;
