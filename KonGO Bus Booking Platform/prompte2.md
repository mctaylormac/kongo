# 💻 [Agent Dev Web] - Roadmap Frontend (Roadmap d'Intégration)

## 🎯 Objectif de la session
Intégrer les nouvelles tables Supabase (`stops` et `age_categories`) dans l'interface utilisateur de la plateforme web KonGO.

## 📌 Tâche 1 : Mise à jour de `AppConstants.ts` et des Types Supabase
- **Typage des nouvelles entités :**
  - Interfaces pour `Stop` (id, name, city_name, etc.)
  - Interfaces pour `AgeCategory` (id, name, discount_percentage)
- **Export :** S'assurer que les modèles de données sont utilisables partout dans l'application.

## 📌 Tâche 2 : Intégration dans `UserDashboard.tsx`
- **Récupération des arrêts (Fetch) :**
  - Lorsqu'un utilisateur clique sur une province ou cherche une ville, récupérer la liste des arrêts associés depuis Supabase (`supabase.from('stops').select('*').eq('city_name', selectedCity)`).
- **Affichage UI :** 
  - Afficher une sous-liste ("Arrêts disponibles") dynamique sur l'interface du dashboard pour la province/ville actuellement sélectionnée.
  - Le style doit rester moderne et utiliser les utilitaires Tailwind existants.

## 📌 Tâche 3 : Adaptation de la recherche (`SearchResults.tsx` / `SearchWidget`)
- **Modification des Selects :**
  - Le point de départ et le point d'arrivée doivent dorénavant permettre la sélection d'un arrêt spécifique (cascade : `Province -> Arrêt`).
- **Mise à jour des paramètres de recherche :**
  - Mettre à jour `demoSearchParams` ou la logique locale pour accepter `departure_stop_id` / `arrival_stop_id`.

## 📌 Tâche 4 : Intégration dans `PaymentFlow.tsx` (Prix Dynamiques)
- **Assigner un passager par siège :**
  - À l'étape des Sièges ou des Passagers, modifier le formulaire. Pour chaque siège sélectionné, permettre à l'utilisateur de choisir la catégorie d'âge (Adulte, Enfant, Bébé) via un sélecteur appelant les `age_categories` en DB.
- **Calcul du Prix Total Panier :**
  - Formule : `(Prix du trajet * (1 - discount_percentage / 100))`.
  - Assurer la conversion ou le recalcul sur le front pour un affichage réactif avant de confirmer le paiement.

---

> Dès que ce prompt est validé, nous activerons les agents : **Agent Dev Web** (Code / Store / Fetch) et **Agent Stitch** (UX/UI Components).
