// =============================================================================
// src/pages/PageLogin.jsx — l'écran de connexion (KIT TP6, PARTIE 3)
// -----------------------------------------------------------------------------
// UN FORMULAIRE "CONTRÔLÉ"
//   En HTML classique, c'est le champ <input> qui retient ce qu'on tape, et on
//   va le lire avec document.getElementById(...).value.
//   En React, c'est l'ÉTAT qui retient la valeur ; le champ ne fait que
//   l'AFFICHER. Deux attributs, toujours les mêmes, pour chaque champ :
//     value={etat}                              le champ affiche l'état
//     onChange={(e) => setEtat(e.target.value)} chaque frappe met l'état à jour
//   La boucle : je tape → onChange → setEtat → nouveau rendu → value change.
//   Avantage : la valeur est toujours disponible dans une variable JS
//   (validation, bouton désactivé, remise à zéro... deviennent faciles).
//
// LE PATRON try / catch / finally (le même qu'au TP5)
//   try     : on tente la connexion
//   catch   : ça a échoué (401...) → on affiche le message de l'API
//   finally : dans tous les cas → on réactive le bouton
//
// Deux TODO à compléter (repères TODO 1 et TODO 2).
// =============================================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexte/AuthContext";

function PageLogin() {
  // On récupère la fonction connexion diffusée par le contexte (partie 2)...
  const { connexion } = useAuth();
  // ...et une fonction pour changer d'URL DEPUIS LE CODE (partie 1).
  // (<Link> sert dans le JSX, quand l'utilisateur clique ; useNavigate sert
  //  quand c'est le programme qui décide, ici après une connexion réussie.)
  const naviguer = useNavigate();

  // Un état par champ du formulaire, vide au départ
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  // Deux états "techniques" :
  const [erreur, setErreur] = useState(null); // message à afficher en cas d'échec (null = rien)
  const [envoi, setEnvoi] = useState(false); // true pendant l'appel → bouton désactivé

  // ---------------------------------------------------------------------------
  // gererSoumission : appelée à la soumission du formulaire (clic sur le
  // bouton OU touche Entrée dans un champ). React lui passe l'événement.
  // ---------------------------------------------------------------------------
  async function gererSoumission(evenement) {
    // INDISPENSABLE : par défaut, un navigateur ENVOIE le formulaire et
    // RECHARGE la page (comportement historique du HTML). La page repartirait
    // de zéro, l'état serait perdu et le login ne se ferait pas.
    evenement.preventDefault();

    setErreur(null); // on efface un éventuel ancien message
    setEnvoi(true); // on désactive le bouton (évite les doubles clics)
    try {
      // connexion() vient du contexte : elle appelle l'API, range le jeton
      // et met l'utilisateur dans l'état. Elle renvoie l'utilisateur.
      const utilisateur = await connexion(email, motDePasse);
      // TODO 1 : rediriger selon le rôle
      //   → vers '/admin' si utilisateur.role vaut 'admin', sinon vers '/'
      //     (un ternaire dans les parenthèses de naviguer). En attendant,
      //     VS Code souligne utilisateur : pas encore utilisé.
      naviguer(utilisateur.role === "admin" ? "/admin" : "/");
    } catch (err) {
      // L'exception levée par api.js contient le message de l'API :
      // 401 → "Identifiants incorrects." (le même pour un email inconnu et un
      // mauvais mot de passe : on ne dit pas à un pirate ce qui est faux)
      setErreur(err.message);
    } finally {
      setEnvoi(false); // succès ou échec : on réactive le bouton
    }
  }

  return (
    <main className="contenu">
      {/* onSubmit sur le <form> (et non onClick sur le bouton) : couvre aussi
          la touche Entrée. className="carte-login" : style dans App.css. */}
      <form className="carte-login" onSubmit={gererSoumission}>
        <h2>Connexion</h2>

        {/* Affichage conditionnel (TP5) : le paragraphe n'existe QUE s'il y a
            une erreur. erreur vaut null au départ → rien n'est affiché. */}
        {erreur && <p className="erreur">{erreur}</p>}

        {/* MODÈLE : le champ email, contrôlé par l'état email */}
        {/* Le <label> entoure le champ : cliquer sur le texte place le curseur */}
        <label>
          Adresse email
          <input
            type="email" // le navigateur vérifie le format
            value={email} // le champ AFFICHE l'état
            onChange={(e) => setEmail(e.target.value)} // chaque frappe MET À JOUR l'état
            required // champ obligatoire (HTML5)
          />
        </label>

        {/* TODO 2 : le champ « Mot de passe », sur le même modèle
              → type="password", value relié à l'état motDePasse,
                onChange qui appelle setMotDePasse, required
              (Sans onChange, le champ semblerait "bloqué" : l'état ne bouge pas.) */}
        <label>
          Mot de passe
          <input
            type="password" // le navigateur vérifie le format
            value={motDePasse} // le champ AFFICHE l'état
            onChange={(e) => setMotDePasse(e.target.value)} // chaque frappe MET À JOUR l'état
            required // champ obligatoire (HTML5)
          />
        </label>
        {/* type="submit" : ce bouton déclenche le onSubmit du formulaire.
            disabled={envoi} : grisé pendant l'appel à l'API.
            Le texte change aussi pendant l'envoi (ternaire). */}
        <button type="submit" disabled={envoi}>
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

export default PageLogin;
