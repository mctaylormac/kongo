# Demande Antigravity: Kongo Chauffeur (mobile) ? Connexion, Scan, Validation, Historique

Objectif

- Produire un brief clair pour un modele qui doit concevoir un mini-projet mobile ?Kongo Chauffeur?.
- Pages a modeliser via le serveur MCP de Stitch: Connexion, Scan & Validation ticket (avec case a cocher), Historique.

Contexte

- Application mobile destinee aux chauffeurs/agents pour scanner et valider des tickets.
- L?UX doit etre simple et robuste en conditions terrain.
- Le site web doit ensuite voir les tickets valides (synchronisation backend existante).

Contraintes

- Flux minimal: Auth -> Scan -> Validation -> Historique.
- Validation du ticket via une case a cocher (confirmation manuelle apres scan).
- Mode offline degrade (au moins UI): afficher et mettre en file d?attente les validations.
- Design sobre, lisible, actionnable en une main.

Pages a modeliser (Stitch MCP)

1. Connexion

- Champs: email, mot de passe.
- CTA principal: ?Se connecter?.
- CTA secondaire: ?Mot de passe oublie?.
- Etat erreurs: mauvais identifiants, reseau indisponible.
- Branding: logo KonGO, couleur principale kongo-lime.

2. Scan & Validation

- Zone camera (placeholder si permissions refusees).
- Bouton ?Activer camera? + etat permissions.
- Affichage du resultat du scan (ticket_code, nom client, trajet, date/heure).
- Case a cocher ?Je confirme la validation du ticket?.
- CTA ?Valider le ticket? (disabled tant que case non cochee).
- Etats: valide avec succes, deja valide, ticket invalide, hors ligne (mise en attente).

3. Historique

- Liste des tickets traites (valides/invalides).
- Filtres: Aujourd?hui / Semaine / Tous.
- Badge statut: valide, refuse, en attente sync.
- Details rapides: code, heure, nom client, trajet.

Flux utilisateur (a representer)

- Connexion -> Scan (camera) -> affichage ticket -> coche la case -> validation -> message de succes -> ajout a historique.
- Si hors ligne: validation en local -> statut ?en attente sync?.

Donnees minimales par ticket

- ticket_code
- booking_id / trip_id
- nom client
- trajet (origine/destination)
- date/heure
- statut validation

Integraions attendues (concept)

- Endpoint scan/validation: POST /ticket_scans
- Lecture historique: GET /ticket_scans?driver_id=...
- Auth: supabase auth ou endpoint existant

Livrable attendu du modele

- 3 ecrans UI complets (Connexion, Scan/Validation, Historique)
- Etats d?erreur principaux
- Composants reutilisables (badge statut, carte ticket)
- Workflow ecrit (etapes + data)
