// =============================================================================
// src/services/api.js — point UNIQUE d'accès à l'API GestiTicket (KIT TP7, fourni complet)
// -----------------------------------------------------------------------------
// VERSION COMPLÈTE : une fonction par route de l'API du TP3.
// requete() est IDENTIQUE au TP6 : le jeton JWT est joint AUTOMATIQUEMENT.
//
// À QUOI SERT CE FICHIER ?
//   Les composants React (pages, formulaires...) ne parlent JAMAIS directement
//   au serveur. Ils appellent une fonction d'ici : getTickets(), login()...
//   Avantage : toute la "plomberie" réseau (adresse, en-têtes, JSON, erreurs)
//   est écrite UNE SEULE FOIS, dans requete(). Si l'API change, on ne modifie
//   que ce fichier.
//
//   Composant  ──appelle──▶  fonction d'api.js  ──appelle──▶  requete()
//                                                               │
//                                                         fetch ▼
//                                                         serveur PHP (API)
//
// LE SCHÉMA DE TOUTE ACTION D'ÉCRITURE (TP7)
//   1. l'utilisateur agit (clic, formulaire)
//   2. le composant appelle une fonction de ce fichier (POST / PUT / DELETE)
//   3. l'API vérifie le jeton et le rôle, agit en base, renvoie le résultat
//   4. le composant met son ÉTAT à jour avec ce résultat → l'écran suit
//
// RAPPEL – NOMS DES CHAMPS : côté React on écrit en camelCase (idCategorie),
// l'API attend les noms de la base en snake_case (id_categorie).
// La conversion se fait ICI, et nulle part ailleurs. Un nom mal écrit →
// l'API répond 400 (« ... sont obligatoires »).
//
// QUELLE MÉTHODE HTTP ?
//   GET    lire        |  POST  créer
//   PUT    modifier    |  DELETE supprimer
//
// TOUTES LES FONCTIONS DE CE FICHIER RENVOIENT UNE PROMISE
//   Une Promise = "une réponse qui arrivera plus tard" (le réseau prend du
//   temps). Dans un composant, on l'utilise donc avec await :
//       const tickets = await getTickets();
//   ou avec .then() :
//       getTickets().then((tickets) => setTickets(tickets));
// =============================================================================

// Début commun de TOUTES les adresses appelées.
// On n'écrit pas "http://localhost:8000/..." : on écrit juste "/api".
// Pendant le développement, Vite (le serveur qui affiche le site React)
// intercepte tout ce qui commence par /api et le TRANSMET au vrai serveur PHP
// (c'est le "proxy", réglé dans vite.config.js au TP5).
// Exemple : requete('GET', '/tickets') → fetch('/api/tickets') → serveur PHP.
const BASE = '/api';   // le proxy de Vite complète l'adresse (TP5)

// -----------------------------------------------------------------------------
// entetesAuth() : prépare l'en-tête d'authentification (TP6)
// -----------------------------------------------------------------------------
// Renvoie { Authorization: 'Bearer ...' } si un jeton est stocké, sinon {} (TP6).
//
// LE JETON (JWT), C'EST QUOI ?
//   Une sorte de "badge" que l'API nous donne quand on se connecte (login).
//   On le range dans localStorage (la mémoire du navigateur, qui survit même
//   si on recharge la page). Ensuite, à CHAQUE requête, on montre ce badge à
//   l'API dans l'en-tête "Authorization". Sans badge → l'API répond 401.
//
//   "Bearer" = "porteur" en anglais : "je suis le porteur de ce jeton".
//   C'est le format standard : Authorization: Bearer eyJhbGciOi...
function entetesAuth() {
  // On relit le jeton à CHAQUE appel (et pas une seule fois au chargement) :
  // ainsi, juste après la connexion ou la déconnexion, c'est déjà à jour.
  // getItem renvoie null s'il n'y a rien sous la clé 'jeton'.
  const jeton = localStorage.getItem('jeton');

  // Opérateur ternaire :  condition ? valeurSiVrai : valeurSiFaux
  //   - jeton présent → { Authorization: 'Bearer eyJ...' }
  //   - pas de jeton  → {} (objet vide : on n'ajoute aucun en-tête)
  // `Bearer ${jeton}` est un "template literal" (entre accents graves `) :
  // ${...} insère la valeur de la variable dans le texte.
  return jeton ? { Authorization: `Bearer ${jeton}` } : {};
}

// -----------------------------------------------------------------------------
// requete() : LA fonction qui fait vraiment l'appel réseau
// -----------------------------------------------------------------------------
// Fonction unique pour tous les appels (méthode, chemin, corps facultatif) — TP6.
//
//   methode : 'GET', 'POST', 'PUT' ou 'DELETE'
//   chemin  : la fin de l'adresse, ex. '/tickets' ou '/tickets/3'
//   corps   : les données à envoyer (un objet JS) — FACULTATIF.
//             Pour un GET ou un DELETE on ne le donne pas : il vaut undefined.
//
// "async" : la fonction contient des "await" (attentes du réseau).
// Une fonction async renvoie TOUJOURS une Promise.
async function requete(methode, chemin, corps) {
  // 1) On prépare les options de fetch (la "fiche" de la requête).
  const options = {
    method: methode,
    headers: {
      'Content-Type': 'application/json',  // le corps envoyé est du JSON
      // "..." = opérateur SPREAD : il "déverse" ici le contenu de l'objet
      // renvoyé par entetesAuth().
      //   - avec jeton : on obtient  Authorization: 'Bearer eyJ...'
      //   - sans jeton : {} est vide, donc rien n'est ajouté.
      ...entetesAuth(),                    // le jeton, s'il existe (spread)
    },
  };

  // 2) S'il y a des données à envoyer (POST, PUT), on les ajoute.
  //    Le réseau ne transporte que du TEXTE : JSON.stringify transforme
  //    l'objet JS  { email: 'a@b.fr' }  en texte  '{"email":"a@b.fr"}'.
  if (corps !== undefined) {
    options.body = JSON.stringify(corps);  // objet JS → texte JSON
  }

  // 3) On envoie la requête et on ATTEND (await) la réponse du serveur.
  //    `${BASE}${chemin}` colle les deux morceaux : '/api' + '/tickets'.
  const reponse = await fetch(`${BASE}${chemin}`, options);

  // 4) On vérifie que tout s'est bien passé.
  // fetch ne lève pas d'exception sur une erreur HTTP : on teste nous-mêmes.
  // reponse.ok vaut true si le code est entre 200 et 299 (succès), false sinon.
  // 400 données invalides | 401 pas de jeton | 403 rôle insuffisant
  // 404 introuvable       | 409 doublon      | 500 erreur serveur
  if (!reponse.ok) {
    // L'API envoie normalement un message d'erreur en JSON : { erreur: "..." }.
    // MAIS si le serveur a planté, la réponse n'est peut-être pas du JSON,
    // et reponse.json() échouerait. Le .catch(() => ({})) dit alors :
    // "si la lecture échoue, prends un objet vide à la place".
    // (Les parenthèses autour de {} sont obligatoires : sans elles, JS
    //  croirait que {} est le corps de la fonction, et non un objet.)
    const data = await reponse.json().catch(() => ({}));

    // throw = on LÈVE une erreur : la fonction s'arrête ici, et l'erreur
    // "remonte" jusqu'au try/catch du composant qui a fait l'appel.
    // data.erreur || `Erreur ${...}` : on prend le message de l'API s'il
    // existe, sinon un message générique comme "Erreur 500".
    throw new Error(data.erreur || `Erreur ${reponse.status}`);   // message de l'API
  }

  // 5) Succès : on transforme le texte JSON reçu en objet JS
  //    (l'inverse de JSON.stringify) et on le renvoie au composant.
  return reponse.json();
}

// =============================================================================
// LES FONCTIONS UTILISÉES PAR LES COMPOSANTS
// -----------------------------------------------------------------------------
// Elles sont toutes écrites sur le même modèle : une fonction fléchée qui
// appelle requete() avec la bonne méthode, le bon chemin et le bon corps.
//
//   export const getTickets = () => requete('GET', '/tickets');
//
//   - export     : la fonction peut être importée dans un autre fichier :
//                  import { getTickets } from '../services/api';
//   - () => ...  : fonction fléchée. SANS accolades après la flèche, le
//                  résultat est renvoyé automatiquement (pas besoin de return).
//                  Ici, elle renvoie donc la Promise donnée par requete().
// =============================================================================

// =============================================================================
// LECTURE (tout le monde, sans jeton)
// =============================================================================
// Pas de 3e argument : un GET ne transporte pas de corps (corps = undefined).
export const getTickets = () => requete('GET', '/tickets');
export const getCategories = () => requete('GET', '/categories');

// GET /tickets/3 → le ticket ET la liste de ses interventions (tableau)
// id arrive de useParams : c'est une chaîne ("3"), ce n'est pas gênant ici.
// L'id fait partie de l'ADRESSE : `/tickets/${id}` donne '/tickets/3'.
export const getUnTicket = (id) => requete('GET', `/tickets/${id}`);

// =============================================================================
// CONNEXION (TP6)
// =============================================================================
// POST /login → { jeton: "eyJ...", utilisateur: { id, nom, prenom, email, role } }
// On utilise POST (et pas GET) : un mot de passe ne doit jamais être mis
// dans l'adresse, où il resterait visible dans l'historique du navigateur.
//
// { email, mot_de_passe: motDePasse } est un raccourci pour :
//   { email: email, mot_de_passe: motDePasse }
//   - email          : la clé et la variable ont le même nom → on l'écrit une fois
//   - mot_de_passe   : nom attendu par l'API (snake_case)
//     motDePasse     : nom de la variable côté React (camelCase)
//
// Le jeton reçu est rangé dans localStorage par AuthContext.jsx (connexion()),
// puis entetesAuth() le joindra tout seul à toutes les requêtes suivantes.
// Mauvais identifiants → 401 → requete() lève une erreur.
export const login = (email, motDePasse) =>
  requete('POST', '/login', { email, mot_de_passe: motDePasse });

// =============================================================================
// UTILISATEUR CONNECTÉ (jeton obligatoire, sinon 401)
// -----------------------------------------------------------------------------
// Rien de spécial à faire ici pour le jeton : requete() l'ajoute toute seule.
// =============================================================================

// POST /tickets/3/interventions
// L'API renvoie le ticket COMPLET mis à jour (nouvelle intervention, statut
// éventuellement passé à 'resolu') : le composant n'a qu'à remplacer son état.
// cloture_ticket : true si la case « résout le ticket » est cochée.
// Ici, l'id du ticket va dans l'ADRESSE, le reste dans le CORPS.
export const intervenir = (idTicket, contenu, clotureTicket) =>
  requete('POST', `/tickets/${idTicket}/interventions`, {
    contenu,                         // raccourci pour  contenu: contenu
    cloture_ticket: clotureTicket,   // camelCase → snake_case
  });

// PUT /utilisateurs/3 → l'API renvoie l'utilisateur mis à jour.
// infos = { nom, prenom, email } (+ mot_de_passe seulement s'il a été saisi).
// L'API refuse (403) de modifier le compte de quelqu'un d'autre.
// Ici on transmet l'objet infos tel quel : c'est le composant qui l'a déjà
// construit avec les bons noms de champs (nom, prenom, email, mot_de_passe).
export const modifierProfil = (id, infos) =>
  requete('PUT', `/utilisateurs/${id}`, infos);

// =============================================================================
// ADMINISTRATEUR (l'API vérifie le RÔLE à chaque appel : 403 sinon)
// -----------------------------------------------------------------------------
// Masquer un bouton dans React ne suffit PAS à protéger : n'importe qui peut
// envoyer une requête à la main. La vraie sécurité, c'est l'API qui lit le
// rôle dans le jeton. Connecté mais pas admin → 403.
// =============================================================================

// GET /utilisateurs → la liste, avec nb_tickets pour chacun
export const getUtilisateurs = () => requete('GET', '/utilisateurs');

// DELETE /utilisateurs/3 → { message: "..." }
// En base, ON DELETE CASCADE (TP1) supprime aussi ses tickets.
// Pas de corps : l'id dans l'adresse suffit pour savoir qui supprimer.
export const supprimerUtilisateur = (id) =>
  requete('DELETE', `/utilisateurs/${id}`);

// POST /tickets → le ticket créé (avec son id)
// idCategorie doit être un NOMBRE (Number(...) dans le composant).
// (Un <select> donne toujours une chaîne, "2", et pas le nombre 2.)
export const ajouterTicket = (titre, description, idCategorie) =>
  requete('POST', '/tickets', { titre, description, id_categorie: idCategorie });

// POST /categories → la catégorie créée { id, libelle, niveau_urgence }
// niveauUrgence doit être un ENTIER de 1 à 4 (is_int côté PHP → 400 sinon).
// Libellé déjà existant → 409 (contrainte UNIQUE en base).
export const ajouterCategorie = (libelle, niveauUrgence) =>
  requete('POST', '/categories', { libelle, niveau_urgence: niveauUrgence });
