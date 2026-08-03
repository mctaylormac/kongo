# Demande Antigravity: erreurs reseau et 400 Supabase (SearchResults/PaymentFlow)

Objectif
- Diagnostiquer les erreurs reseau et l'erreur 400 sur /rest/v1/bookings.
- Proposer un plan d'action concret (tests + correctifs) pour stabiliser la recuperation des trajets et la creation de reservations.

Sources analysees
- requete/antigravity_booking_dashboard.md
- req/20260324_1135_booking_dashboard.txt
- Errors fournis par le demandeur:
  - Failed to load resource: net::ERR_NAME_NOT_RESOLVED
  - SearchResults.tsx:302 Erreur lors de la recuperation des trajets: TypeError: Failed to fetch
  - yzsujxyltodcoynkqxsv.supabase.co/rest/v1/bookings:1 400
  - PaymentFlow.tsx:344 Erreur lors de la creation de la reservation: Object

Contexte connu
- Le flux de reservation a deja ete corrige dans un precedent travail (payload adapte a la vraie structure BDD).
- Le dashboard agence repose sur les bookings + trips.

Hypotheses principales (classees)
1) Erreur DNS / reseau local (net::ERR_NAME_NOT_RESOLVED)
   - Le hostname Supabase n'est pas resolu (DNS offline, bloque, ou erreur de configuration VITE_SUPABASE_URL).
   - Consequence: fetch echoue dans SearchResults et PaymentFlow.

2) Mauvaise URL Supabase dans .env
   - Si VITE_SUPABASE_URL est invalide ou manque le schema https, le navigateur ne peut pas resoudre.

3) Erreurs 400 sur /bookings dues au schema
   - Payload ou colonnes ne correspondent pas (ex: booking_reference vs booking_code, profile_id vs user_id).
   - La BDD renvoie 400 (invalid input, column not found, constraint violation).

4) RLS ou auth
   - 400 peut aussi arriver si policy exige un champ ou si l'anon key n'a pas acces.
   - Verifier si les requetes passent en mode anon ou avec session.

Plan d'action minimal (a executer)

A) Verifier la connectivite DNS
1) Depuis le navigateur, ouvrir:
   - https://yzsujxyltodcoynkqxsv.supabase.co
   - https://yzsujxyltodcoynkqxsv.supabase.co/rest/v1/trips
   Resultat attendu: page JSON/erreur auth mais DNS resolu.
2) Depuis la machine dev:
   - nslookup yzsujxyltodcoynkqxsv.supabase.co
   - ping yzsujxyltodcoynkqxsv.supabase.co (optionnel, peut etre bloque)
3) Si net::ERR_NAME_NOT_RESOLVED persiste:
   - Tester un autre reseau (4G) ou un DNS public (1.1.1.1 / 8.8.8.8).

B) Verifier la config Supabase cote frontend
1) Ouvrir .env et confirmer:
   - VITE_SUPABASE_URL commence par https:// et correspond au projet.
   - VITE_SUPABASE_ANON_KEY est present.
2) Dans src/lib/supabase.ts, confirmer createClient utilise bien ces valeurs.
3) Redemarrer le dev server (Vite ne recharge pas toujours les .env en live).

C) Diagnostiquer l'erreur 400 sur /bookings
1) Activer les logs HTTP dans le navigateur (Network tab), capturer:
   - Request payload exact
   - Response body (erreur detaillee)
2) Executer un insert minimal depuis SQL Editor Supabase:
   - insert into bookings (booking_code, trip_id, user_id, total_price, payment_status)
     values ('TEST123', '<trip_id_valide>', '<user_id_valide>', 1000, 'paid');
   - verifier si la table accepte bien ces colonnes.
3) Comparer avec le payload du frontend et aligner les champs.

D) Corriger SearchResults (si fetch trips echoue)
1) Verifier que supabase.from('trips') fonctionne avec la policy RLS.
2) Si 401/403, ajuster policy pour select sur trips.
3) Si 400, verifier le select avec relations:
   - agencies(name, rating)
   - origin:locations!origin_location_id(id, name)
   - destination:locations!destination_location_id(id, name)
   - Si relation name differente, corriger les alias.

E) Correctifs attendus (si causes confirment)
1) DNS/URL:
   - Corriger VITE_SUPABASE_URL + redemarrer Vite.
2) 400 bookings:
   - Aligner le payload aux colonnes reelles (cf rapport 20260324_1135).
   - Si besoin, adapter PaymentFlow et/ou creer des colonnes manquantes.
3) RLS:
   - Ajouter policy SELECT pour trips.
   - Ajouter policy INSERT pour bookings (ou RPC securisee).

Livrables attendus du modele executant
- Rapport court: cause exacte (DNS, URL, schema, RLS) + preuve (logs ou requetes).
- Patch minimal propose (code ou SQL).
- Validation: une reservation doit apparaitre dans dashboard agence apres correction.
