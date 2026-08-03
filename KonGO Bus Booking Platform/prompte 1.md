# 🧠 [Agent Brainstorming] - Audit & Planification des Nouvelles Fonctionnalités

## 1. Gestion des Tarifs par Catégorie d'Âge (Sièges)
**Objectif :** Un billet ou un siège doit avoir un prix dynamique en fonction de l'âge du passager (ex: Adulte, Enfant, Bébé).

### 🗄️ Actions Base de Données (Agent Supabase)
- **Table des tarifs :** Préférer une approche où on garde le prix de base du trajet, et on applique des *modificateurs de prix* basés sur la catégorie du passager.
- **Nouvelle table `age_categories` ou `pricing_tiers` :** 
  - Champs : `id`, `name` (Adulte, Enfant...), `discount_percentage` (ex: 100% pour Adulte, 50% pour enfant).
  - *Alternative :* Une table `trip_pricing` (id, trip_id, age_category, price) si chaque voyage a son propre prix défini "en dur" par catégorie.

### 💻 Actions Frontend (Agent Dev Web / React)
- **Mise à jour du Flux de Réservation :** Lors de la sélection d'un siège, demander "Qui va occuper ce siège ?" (Catégorie d'âge).
- **Calcul Dynamique :** Modifier le calcul du Total Panier dans le `PaymentFlow.tsx` en tenant compte du prix unitaire altéré par la catégorie (Exemple : 40$ Adulte, 20$ Enfant).

---

## 2. Gestion des Arrêts de Bus (Provinces/Villes)
**Objectif :** Afficher les différents arrêts (gares ou points de montée/descente) pour chaque province/ville de départ et d'arrivée.

### 🗄️ Actions Base de Données (Agent Supabase)
- **Création d'une table `stops` (Arrêts) :**
  - Champs : `id`, `name_fr` (Nom de l'arrêt), `province_id` (Lien avec la province/ville), `address`, `latitude`, `longitude`.
- **Adaptation de la table `trips` (Trajets) :**
  - Remplacer (ou ajouter à) `departure_city` par `departure_stop_id` et `arrival_stop_id` afin de lier directement les arrêts exacts.

### 💻 Actions Frontend (Agent Dev Web / React)
- **UserDashboard.tsx :** Lorsqu'on clique sur une province, faire un fetch asynchrone pour lister les "Arrêts disponibles dans cette province".
- **SearchResults.tsx & Widget de Recherche :** Ajouter une notion de filtre par arrêt et non plus seulement par grande province. (Parcours en 2 temps : Choix Province -> Choix de l'arrêt spécifique).

---

## 🎯 Plan d'Exécution (Ce que nous devons implémenter dans l'ordre)

1. **[Agent Supabase]** : Rédiger et exécuter le script SQL pour créer la table `stops` et la table `age_categories`. Mettre à jour les politiques RLS.
2. **[Agent Dev Web]** : Mettre à jour le fichier `AppConstants.ts` (ou le fichier de typage) avec les nouvelles interfaces TypeScript (`Stop`, `AgeCategory`).
3. **[Agent Stitch & Dev Web]** : Intégrer la sélection "Âge" pour chaque siège dans la page de paiement (`PaymentFlow.tsx`).
4. **[Agent Stitch & Dev Web]** : Insérer la liste des arrêts dans les aperçus de province (sur `UserDashboard.tsx`).
