---
title: Search Catalog MVP - Behavior Update
date: 2026-03-14
status: draft
---

# Contexte

L'utilisateur veut un MVP sans integration paiement. La page "Recherche" doit afficher tous les voyages par defaut (pas de nouvelle page ni route). Le bouton "Voir toutes les destinations" doit renvoyer vers la page Recherche. Le QR code doit encoder le numero du ticket. Les contrastes, tailles et couleurs de certains elements UI doivent etre ajustes pour un meilleur rendu. Les visuels fournis sont des references de style.

# Objectifs

- Remplacer le comportement "aucune recherche -> ecran vide" par "liste complete de voyages".
- Reutiliser les filtres de la Home dans la page Recherche.
- Garder une seule page/route: `NAVIGATION_PAGES.SEARCH`.
- Bouton "Voir toutes les destinations" amène a la page Recherche.
- QR code encode la reference du ticket.
- Ameliorer tailles/contrastes/couleurs des CTA, badges et sections ciblees.
- Eviter toute persistance de donnees sensibles de paiement.

# Non-objectifs

- Integration paiement reelle.
- Backend Express / orchestration RBAC.
- Nouvelle page ou nouvelle route.

# Hypotheses

- Les donnees voyages proviennent de Supabase.
- Les filtres Home sont disponibles dans les composants Home existants.
- Le MVP peut rester en mode "demo" pour certaines parties (ex: paiement).

# Design Fonctionnel

## 1) Recherche = Catalogue par defaut

Comportement:
- Si `searchParams` est `null`, la page Recherche charge et affiche tous les voyages.
- Le header affiche "Tous les voyages" + sous-titre explicatif.
- Les filtres sont visibles et operants.

## 2) Bouton "Voir toutes les destinations"

Comportement:
- Bouton renvoie vers la page Recherche (currentPage = SEARCH).
- Si deja sur Recherche, il scrolle en haut de la liste.

## 3) QR Code Ticket

Comportement:
- Le contenu du QR code encode `TICKET-<bookingReference>` ou le numero du ticket.
- Le rendu reste SVG mais doit produire un vrai QR scannable.
- Si aucune reference, fallback: `TICKET-UNKNOWN`.

## 4) UI: Taille / contraste / couleurs

Zones ciblees (selon captures):
- CTA double bouton (Voir toutes les destinations / Demander un trajet personnalise).
- Badge "Pret a commencer".
- Cartes de programme fidelite / niveaux.
- Footer et sections stats (contraste texte/fond).
- Cards Agences (badges premium/verifie).

Modifs attendues:
- Augmenter taille des CTA et padding.
- Ameliorer contrastes texte/fond (luminosite du texte + couleur du fond).
- Harmoniser le lime/vert KonGO entre boutons et badges.
- Revoir l'epaisseur de bordure des badges pour lisibilite.

# Architecture & Composants

Modifs principales:
- `SearchResults.tsx`: logique de chargement + UI par defaut.
- `Home` (composant a identifier): bouton "Voir toutes les destinations" doit naviguer vers SEARCH.
- `TripConfirmation.tsx`: QR code rendu par librairie.
- Styles: ajustements dans `index.css` ou classes Tailwind.

# Data Flow

1. `SearchResults` appelle Supabase:
   - Sans params: `trips` complets (status scheduled).
   - Avec params: filtrage actuel.
2. Filtrage local combine:
   - Filtres Home (region, niveau, premium) adaptes aux champs voyages.
   - Filtres deja existants (prix, amenites, heure).
3. Selection d'un trajet reste identique.

# Gestion d'erreurs

- Supabase error: afficher message + liste vide.
- Aucun voyage: afficher bloc "Aucun resultat".
- QR code: si generation echoue, fallback texte avec reference.

# Tests / Verification

Manuels:
- Page Recherche sans params => liste complete visible.
- Bouton "Voir toutes les destinations" => navigation search + scroll top.
- Filtres Home appliquent une reduction de la liste.
- QR code scannable retourne le numero du ticket.
- Contrastes lisibles sur sections marquees.

Automatises (optionnel MVP):
- Unit test simple: `SearchResults` sans params rend "Tous les voyages".

# Rollout

- MVP UI only, pas de backend paiement.
- Risque principal: RLS Supabase (non traite ici).

# Questions Ouvertes

- Mapping exact des filtres Home sur champs voyages (ex: "niveau de service").
- Sources d'images dans `/image` (chemin exact a confirmer).

