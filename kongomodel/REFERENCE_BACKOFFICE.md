# Documentation de Référence : Backoffice KONGO (V1)

Ce document sert de spécification fonctionnelle basée sur l'ancien système pour assurer la parité des fonctionnalités dans le nouveau backoffice.

## 1. Hiérarchie des Comptes et Permissions

### A. Superuser (Administrateur Global)
*   **Rôle** : Audit et contrôle total de l'écosystème.
*   **Fonctionnalités clés** :
    *   **Global Audit** : Vue d'ensemble de toutes les agences.
    *   **Gestion des Agences** : Création, modification et suspension des agences partenaires.
    *   **Flotte Totale** : Vue sur tous les véhicules enregistrés sur la plateforme.
    *   **Finance Globale** : Reporting consolidé des revenus et commissions.
    *   **Gestion des Utilisateurs** : Administration des comptes de haut niveau.

### B. Agency (Gérant d'Agence)
*   **Rôle** : Gestionnaire d'une entité de transport spécifique.
*   **Fonctionnalités clés** :
    *   **Tableau de bord Agence** : Indicateurs de performance locaux.
    *   **Ma Flotte** : Enregistrement des bus, gestion des statuts (Actif, Maintenance, En Voyage).
    *   **Mes Voyages & Planification** : Création des calendriers de voyage.
    *   **Arrêts & Trajets** : Configuration des itinéraires et des points d'arrêt.
    *   **Points de Vente** : Gestion des différents guichets physiques.
    *   **Équipe & Chauffeurs** : Recrutement et affectation des chauffeurs aux bus.
    *   **Services Extras** : Configuration des services additionnels (Bagages au kg, Repas, Assurance).
    *   **Finance & Caisse** : Suivi des recettes et clôture des caisses.

### C. Chef (Chef d'Opérations / Garage)
*   **Rôle** : Supervision technique et logistique sur le terrain.
*   **Fonctionnalités clés** :
    *   **Voyages assignés** : Suivi des départs et arrivées.
    *   **Mes Bus** : État technique de la flotte.
    *   **Équipe Chauffeurs** : Disponibilité et planning des chauffeurs.
    *   **Signalements** : Gestion des incidents et pannes.

### D. Cashier (Guichetier / Caissier)
*   **Rôle** : Vente de tickets et service client.
*   **Fonctionnalités clés** :
    *   **Dashboard Caisse** : État actuel de la caisse (entrées/sorties).
    *   **Vente de Ticket (POS)** : Flux rapide de réservation.
    *   **Historique** : Consultation et réimpression des tickets vendus.

---

## 2. Logiques Métier Critiques

### Flux de Réservation (Logiciel de Caisse)
1.  **Récupération Client** : 
    *   Recherche par Numéro de téléphone ou Nom.
    *   Si le client existe : chargement automatique des informations.
    *   Si le client est nouveau : création automatique d'un profil "Client" dans le système lors de la validation.
2.  **Sélection du Voyage** : Choix du trajet, de la date et de l'heure.
3.  **Services Extras** : Ajout manuel de bagages (calcul au kg selon les paliers configurés) ou autres services.
4.  **Confirmation & Paiement** : Validation finale et impression (ou génération) du ticket.

### Gestion de la Flotte
*   **Bus** : Doit être lié à une agence.
*   **Affectation** : Un bus doit avoir un chauffeur assigné pour être éligible à un voyage.
*   **Statuts** :
    *   `Actif` : Disponible pour assignation.
    *   `En Voyage` : Actuellement sur la route (bloqué pour d'autres assignations).
    *   `Maintenance` : Indisponible pour raisons techniques.

### Services Supplémentaires (Extra Services)
*   **Configuration** : Titre, Prix, Catégorie (Bagage, Repas, etc.).
*   **Logique Bagage** : Gestion des poids (min/max) et prix par kilo ou par forfait.

---

## 3. Workflow de Synchronisation (Nouveau Backoffice)
*   **Design** : Utilisation des standards "Premium/Glassmorphism" (UI Apple-like).
*   **Real-time** : Utilisation intensive des souscriptions Supabase pour les suivis GPS et les ventes.
*   **Mobile First** : Toutes les fonctionnalités doivent être utilisables sur tablette/mobile pour les agents de terrain.
