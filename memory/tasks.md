# tasks.md — Suivi des tâches de `reca-operator`

> Statuts : `[ ]` à faire · `[~]` en cours · `[x]` terminée. Chaque tâche terminée garde
> une courte note. Mettre à jour en début et en fin de tâche (voir `CLAUDE.md` section 4).

## Terminées

- [x] **Sprint 001 — Fondation de l'app opérateur** (`.input/tache1.md`)
  Fondation complète : auth Supabase (mêmes projet/table/rôles que RECA App,
  `RequireAuth`/`RequireRole`), layout mission plein écran (header GPS + Play/Pause/Stop,
  liste triée, footer), statuts normalisés, lecture GPS (`useGeolocation`), moteur
  (`useMissionEngine`, tick 1 s), distances haversine (`domain/geo`), chargement CSV de
  démo. Thème sombre calqué sur la maquette `.input/design.png`.

- [x] **tache2 — Chargement de la vraie route + GPS + distances réelles** (`.input/tache2.md`)
  Constat : GPS et calcul de distance existaient déjà (Sprint 001) ; seul le **loader CSV**
  était inadapté. Fait : (1) remplacé `public/demo/route.csv` par la vraie route
  Saint-Jérôme (9 adresses Rue Scott / Rue Saint-Georges, ré-encodée UTF-8, format `;`) ;
  (2) rendu `services/routeCsv.ts` tolérant (délimiteur `;`/`,` auto-détecté, alias
  `lat`/`lng`, colonnes optionnelles `type`/`statut`). Vérifié : `tsc -b` OK, `eslint` OK,
  parse + haversine testés (9 stops, distances réelles ~2 km depuis le point GPS maquette).

- [x] **tache3 — Doc `CLAUDE.md` + système de mémoire** (`.input/tache3.md`)
  Corrigé `CLAUDE.md` (l'app n'est plus un « starter Vite ») et intégré le contenu de
  tache3 (section 4 : mémoire `/memory` ; section 6 : règles d'exploration ; section 5
  d'interface intercalée pour la cohérence des renvois). Créé et amorcé les 4 fichiers
  `memory/` (memory, tasks, plans, file-index).

- [x] **Sprint 003 — Automatisation intelligente des interventions** (maquette `.input/design.png`)
  Extrait TOUTE la logique dans un service pur `engine/MissionEngine.ts` (hors React) :
  GPS, distances, tri par proximité, **vraie machine à états**
  (EN_ATTENTE→EN_ROUTE→EN_APPROCHE→EN_COURS→DEPART→TERMINE ; Problème→NON_TERMINE),
  chronomètres via horloge virtuelle qui se fige en pause, et journal interne des durées
  (déplacement + intervention). `useMissionEngine` réduit à un adaptateur mince
  (`useSyncExternalStore` + push GPS/tick). Nouvel écran : compteur intelligent
  (`SmartCounter`), carte `CurrentMissionCard` (~40 %, section ATTENTION fictive), liste
  toujours triée par distance, modale `ProblemModal` (8 codes), barre `DevControlBar`
  (visible seulement si `DEV_CONTROLS`). Constantes réglables dans `domain/config.ts`
  (rayon 25 m, vitesses 3/5 km/h, délais 30 s). Vérifié : `tsc -b` OK, `eslint` OK,
  cycle complet + chemin Problème testés headless (tsx) sur le vrai moteur.

## En cours

- (aucune)

## Terminées (suite)

- [x] **tache5 — Réglage runtime des paramètres du moteur** (bouton engrenage)
  Ajouté un bouton « Réglages » (engrenage) dans `DevControlBar` ouvrant une nouvelle
  modale `SettingsModal` (bottom-sheet, patron `ProblemModal`) qui règle **en direct** tous
  les paramètres du module : rayon de détection, délais EN COURS / TERMINÉ (réglés en s ↔
  stockés en ms), vitesse de départ min, vitesse arrêt max, toggle mode développement,
  bouton Réinitialiser. Archi : `config.ts` reste la source des **défauts**
  (`DEFAULT_ENGINE_CONFIG` + type `EngineConfig`) ; le `MissionEngine` en tient une **copie
  vivante** (`config`), exposée dans `MissionSnapshot`, modifiable via `setConfig` (ré-évalue
  la machine à états si RUNNING). `useMissionEngine` réexpose `config` + `setConfig` et lit
  `devControls` depuis le snapshot. Runtime seulement, aucune persistance. `LOW_SPEED_KMH`
  exposé mais toujours pas branché dans la logique (marqué « réservé » dans l'UI). Vérifié :
  `tsc -b` OK, `eslint` OK, et test headless (tsx) — à 40 m, rayon 25 m → EN_ROUTE ; rayon
  porté à 60 m via `setConfig` → EN_APPROCHE.

- [x] **Sprint 004 — Assistance vocale (Phases 1 & 2)** (`feat/integration-tts-vocale`)
  Nouvelle **couche voix indépendante** `src/core/voice/` : `VoiceService` (abstraction du TTS
  natif `speechSynthesis`, singleton `voiceService`, `initialize/speak/stop/isEnabled/setEnabled`,
  voix fr-CA, no-op si désactivé/non supporté) ; `VoiceAnnouncementManager` (décideur, singleton
  `voiceAnnouncements`, point de passage obligatoire, 4 méthodes announce*) ; `useVoice` (hook
  glue). Réglage `voiceEnabled` ajouté à `EngineConfig` (défaut true) ; section « Assistance
  vocale » dans `SettingsModal` (toggle + bouton « Tester la voix » → « Bienvenue dans RECA
  Operator. »). **Câblage cycle de vie manuel** : `announceMissionStarted` (transition →RUNNING)
  et `announceMissionCompleted` (completed===total) via `useVoice` ; `announceNextAddress` /
  `announceCriticalAlert` définies mais **non déclenchées** (sprint suivant). **`MissionEngine`
  inchangé** (reste pur). Vérifié : `tsc -b` OK, `eslint` OK, test headless (tsx) — 4 messages
  exacts routés par le manager + gate `speak` (rien quand désactivé) ; grep : aucun TTS dans
  `src/features`.

- [x] **Sprint 005 — Assistance vocale Phase 3 (annonces automatiques GPS)** (`feat/integration-tts-vocale`)
  Le moteur émet désormais un **bus d'événements de domaine** (`onEvent`/`MissionEvent` :
  `MISSION_STARTED`, `ACTIVE_MISSION_CHANGED`, `APPROACH_ENTERED`, `RESIDENCE_SIDE`,
  `MISSION_COMPLETED`) — neutres, le moteur n'appelle jamais la voix. Détection **gauche/droite**
  via cap GPS (`geo.residenceSide` + `bearingDegrees`, `heading` ajouté à `GpsPosition` et capté
  par `useGeolocation`) — silence si non fiable. **Toute la décision** (catégorie activée +
  **anti-répétition** par `Set<ordre>` + drapeaux) est centralisée dans `VoiceAnnouncementManager`
  (handlers `onMissionStarted/onActiveMissionChanged/onResidenceSide/onCriticalAlert/onMissionCompleted`,
  `setCategories`, `reset`). Nouveau pont `features/mission/hooks/useVoiceBridge.ts` (route les
  événements → manager ; **remplace** `core/voice/useVoice.ts`, supprimé). 5 catégories réglables
  indépendamment (`voiceStart/NextAddress/Side/Alerts/End` dans `EngineConfig`) + section
  « Assistance vocale » enrichie dans `SettingsModal`. Vérifié : `tsc -b` OK, `eslint` OK ;
  headless (tsx) — géométrie G/D, dédup+catégories du manager, et séquence d'événements exacte
  (STARTED×1, CHANGED×2, APPROACH×2, COMPLETED×1) ; grep : aucun TTS dans les composants.

- [x] **Voix — sélection de la meilleure voix + affichage** (`feat/integration-tts-vocale`)
  `VoiceService.pickVoice()` ne prend plus la première voix fr venue (souvent la voix compacte
  robotique) : nouvelle fonction `scoreVoice()` qui note les voix françaises et retient la mieux
  notée — marqueurs `premium/enhanced/neural` (+100), `siri` (+60), noms de qualité connus
  (amélie/thomas/aurélie/… +30), `fr-CA` (+10, Québec), `localService` (+5) ; fallback voix fr
  quelconque puis voix par défaut. `pitch=1` fixé sur l'utterance. Nouvelle méthode
  `getVoiceName()` (nom de la voix retenue) exposée via `useVoiceBridge` → prop `voiceName` de
  `SettingsModal`, affichée sous la section « Assistance vocale » (« Voix : … ») pour
  diagnostic. **Aucune logique TTS n'entre dans les composants** (règle maintenue). Vérifié :
  `tsc -b` OK, `eslint` OK.

- [x] **Sprint — Intégration RECA App (source de données Supabase)** (`feat/connexion-reca-app`)
  Remplacé la source CSV temporaire par les données officielles Supabase (Mission/MissionItems),
  même auth que RECA App, avec vérification du rôle opérateur et write-back des statuts. **Seam
  unique** : le `queryFn` de `useMissionEngine` passe de `loadDemoMission` à
  `loadAssignedMission` (`services/missionSupabase.ts`) — moteur GPS, UI et animations inchangés.
  Fait : (1) `missionSupabase.loadAssignedMission()` = résolution `auth.uid → employees.user_id
  → missions.operator_id`, puis `mission_items` joints aux contrats (adresse, GPS,
  `message_operateur`, client) ; `null` → écran « Aucune mission assignée » + Actualiser.
  (2) `services/missionMapping.ts` **pur** (mapItemToStop + correspondances de statuts).
  (3) Moteur : `Stop` gagne `missionItemId` + `operatorMessage` ; **reprise** des statuts
  terminaux (`rehydrateStop` dans `loadMission`/`play`) ; ATTENTION = `operatorMessage` du
  contrat ; événement neutre `STOP_FINALIZED` émis depuis `completeActive`/`reportProblem`.
  (4) Write-back via point unique `services/missionSync.persistItemStatus` + pont
  `hooks/useMissionSync.ts` (bannière « Connexion perdue »). (5) Auth : garde `RequireOperator`
  → écran `AccessDenied` si rôle ≠ operateur ; `PREVIEW_BYPASS` supprimé. (6) Supprimé
  `public/demo/route.csv`, `routeCsv.ts`, `attentionFixtures.ts`. **Décisions** : problème →
  statut `a_reprendre` seulement (pas de colonne `code_probleme`) ; header riche du screenshot
  **non** construit (interface actuelle conservée). Vérifié : `tsc -b` OK, `eslint` OK,
  `npm run build` OK, tests headless (tsx) — mappers + reprise (TERMINE conservé, en_attente
  redevient actif via GPS). **Dépend de** la PR reca-app `feat/operator-integration` (rôle
  operateur + RLS écriture opérateur) appliquée au Supabase partagé + `employees.user_id` peuplé.
  **Validé en direct (2026-07-24)** contre le vrai Supabase avec le compte `operateur@groupereca.ca` :
  connexion → rôle operateur → employé lié → mission #1 → 3 MissionItems (adresse/GPS/message_operateur
  joints du contrat) → write-back RLS autorisé. Migrations 1 & 2 appliquées via SQL Editor ;
  compte + mission de test seedés (voir memory.md « Supabase & auth »).

- [x] **Ordonnancement par ordre de mission (fin du tri par distance)** (2026-07-25)
  À la demande du client : la liste et la sélection du stop actif ne suivent **plus la distance
  GPS** mais l'**ordre de la mission** (`ordre` = rang `created_at` des `mission_items`). Fait dans
  `engine/MissionEngine.ts` : (1) `nearestSelectable()` → `nextSelectableInOrder()` (prochain non
  final au plus petit `ordre`) ; (2) tri de `otherStops` (`buildSnapshot`) par `ordre` au lieu de
  la distance ; (3) docblocks + commentaire `mapItemToStop` mis à jour. Les distances GPS restent
  utilisées **uniquement** par la machine à états (détection arrivée/départ). Vérifié : `tsc -b` OK,
  `eslint` OK. Mémoire corrigée (les 2 anciennes mentions « tri toujours par distance » sont
  révisées).

- [x] **tache4 (reprise) — Refonte écran Mission (`.input/design2.png`) + module carte Mapbox (2026-07-29)**
  Reprend tache4 (carte Mapbox, en pause depuis le Sprint 003) : `design2.png` résout le conflit
  portrait/paysage de l'ancienne maquette `design-v3.png`. Portée confirmée avec le client (3
  questions) : carte MVP fidèle au design, footer « Plus d'options » = nouveau point d'entrée
  **production** des réglages, en-tête branché sur de vraies données Supabase.
  **Moteur** : `MissionSnapshot` gagne `allStops` (copie non filtrée triée par `ordre`, additive —
  `otherStops` inchangé) pour exposer aussi les stops `TERMINE` à la carte.
  **Données** : `Mission.secteur` → `routeName`/`operatorName`/`equipmentName` ;
  `missionSupabase.ts` joint `employees.prenom/nom`, `routes.nom` (`missions.route_id`),
  `equipments.nom` (`missions.equipment_id`, nullable) — aucune migration `reca-app` nécessaire
  (schéma déjà confirmé disponible). `useMissionEngine` réexpose `missionLabel`/`routeName`/
  `operatorName`/`equipmentName`.
  **Carte** : mirror exact du pattern Mapbox de `reca-app` (`mapbox-gl@^3.26.0` direct, pas de
  wrapper React) — `lib/mapboxClient.ts` → `hooks/useMapboxMap.ts` (style par défaut
  `dark-v11`) → `components/map/MapCanvas.tsx` (générique) → `features/mission/components/map/
  MissionMap.tsx` (tracé GeoJSON, marqueurs custom colorés par statut via `statusToneColors.ts`,
  marqueur position + halo + flèche de cap masquée si `heading===null`, recentrer, bascule
  sombre/satellite ; clés `routeKey`/`markersKey` mémorisées pour ne pas recréer marqueurs/tracé à
  chaque fix GPS, seuls `ordre`/`status` important visuellement). Badge « N » statique
  (`CompassBadge.tsx`, la carte ne tourne jamais). `@types/geojson` ajouté en devDependency (sinon
  absent, `reca-app` l'obtient via `@mapbox/mapbox-gl-draw` que reca-operator n'installe pas).
  **Redesign** : `MissionHeaderBar.tsx` (nouveau), `SmartCounter` (+ `variant='pill'`),
  `CurrentMissionCard` (« Prochaine résidence », 2 colonnes si ATTENTION), `MissionCountersRow.tsx`
  (nouveau), `StopRow`/`StopListHeader` (badge numéroté par tone, libellé de tri corrigé — l'ordre
  est celui de la mission, pas la proximité, erreur résiduelle du 2026-07-25), `MissionFooter.tsx`
  (nouveau, remplace `DevControlBar.tsx` supprimé — Annonce vocale = mute toggle `voiceEnabled`),
  `MissionOptionsSheet.tsx` (renommage `SettingsModal.tsx` + Play/Pause/Stop migrés, toujours
  accessible). **Décision** : le bouton icône « reprise » sur les lignes terminales de la liste
  reste décoratif (aucun flux de reprise manuelle dans le moteur — backlog séparé).
  Vérifié : `tsc -b` OK, `eslint` OK, `npm run build` OK. **Non vérifié en direct dans un
  navigateur** (pas d'identifiants de test disponibles dans cette session — `PREVIEW_BYPASS`
  supprimé, auth réelle requise) : à valider manuellement avec le compte `operateur@groupereca.ca`
  (`?sim=1` pour piloter le GPS) avant de considérer le rendu visuel définitif.

## Abandonnées / en suspens

- (aucune)

## À faire (backlog / sprints futurs)

- [ ] **Test runner** : aucun configuré ; en ajouter un avant d'écrire des tests. La
  logique du `MissionEngine` est pure (hors React) → idéale pour des tests unitaires
  (Vitest) de la machine à états.
- [ ] **Reportés du Sprint 003** (portée volontairement limitée à « logique + écran
  principal ») : barre de navigation basse (Liste/Carte/Problème/Menu) et **Fiche
  résidence** détaillée (téléphone client + bouton Problème, ouverture auto à l'arrivée,
  option désactivable) — cf. maquette `.input/design.png`.
- [ ] **Persistance du journal** : `MissionEngine` tient le journal des durées en mémoire
  seule. À synchroniser plus tard (Supabase / module Routes) pour les statistiques.
- [ ] **Voix — annonces futures** (préparées, non implantées) : arrivée détectée, intervention
  commencée/terminée, résidence ignorée, retour vers une résidence problématique. Ajouter les
  événements moteur correspondants + handlers dans `VoiceAnnouncementManager` + catégories dans
  `EngineConfig`/`MissionOptionsSheet`. (Le bus d'événements et l'anti-répétition existent déjà —
  Sprint 005.)
- [ ] **Carte Mapbox — au-delà du MVP (2026-07-29)** : badges de numéros civiques, cône de
  vision, zones de contrat (stationnement/trottoir/escalier), cache hors-ligne des tuiles,
  boussole pilotée par l'orientation réelle du téléphone (actuellement un badge « N » statique,
  la carte ne tourne jamais). Voir `memory/plans.md` (tache4, archivé) pour le détail du MVP livré.
- [ ] **Reprise manuelle d'un stop « À reprendre »** : le bouton icône dédié affiché sur les
  lignes terminales de la liste (check vert / refresh orange) est **décoratif** depuis la refonte
  2026-07-29 — aucune action de reprise manuelle n'existe dans le moteur (seul le GPS ré-engage un
  stop via `ordre`). Construire un vrai flux si le besoin se confirme.

- [x] **Démarrage réel de la Mission côté RECA App (2026-07-25)** — jusqu'ici, `reca-operator`
  ne modifiait jamais la table `missions` (seulement `mission_items.statut`) : le bouton Play ne
  démarrait que le moteur GPS local. Câblage ajouté (depuis une session sur le repo `reca-app`,
  qui a d'abord découvert ce repo puis y a apporté les changements) : `domain/types.ts` (`Mission.id`),
  `services/missionSupabase.ts` (renvoie `id`), `services/missionSync.ts` (nouvelle `startMission`,
  best-effort, filtre `.eq('statut','planifiee')` pour l'idempotence), `hooks/useMissionEngine.ts`
  (expose `missionId`), `hooks/useMissionSync.ts` (appelle `startMission` sur l'événement
  `MISSION_STARTED` du moteur), `pages/MissionPage.tsx` (câblage). Aucun nouveau bouton — la prod
  démarre déjà le moteur automatiquement, l'événement `MISSION_STARTED` (fresh start uniquement,
  jamais une reprise après pause) est le point d'accroche naturel. Détail complet : `memory/plans.md`.
  **Dépendance RLS déjà satisfaite** : `startMission` écrit dans `missions`, autorisé par la policy
  `reca-app` `missions_update_admin_or_operator` (2026-07-25, déjà appliquée en live) — cette policy
  ne teste que le lien `employees.user_id = auth.uid()` + `operator_id`, **pas** la valeur de
  `users.role`, donc elle fonctionne indépendamment du rôle `'operateur'`. La nouvelle migration
  `reca-app` `20260725020000_reconcile_operator_role_and_policies.sql` (élargit `users.role` à
  `'operateur'`, retire l'ancienne policy ad hoc `mission_items_update_operator` en doublon) est
  une réconciliation de schéma/documentation — le rôle `'operateur'` et la policy ad hoc étaient
  déjà appliqués en direct le 2026-07-24 (voir plus haut, section Supabase & auth) et restent
  fonctionnels en attendant que cette migration soit rejouée côté `reca-app` pour que l'historique
  de migrations reflète enfin la réalité. `tsc -b`/`npm run lint`/`npm run build` propres.
  **Poussé sur `origin/main` par l'utilisateur** (commit `142e4ee`).

- [x] **Journalisation du démarrage dans l'historique de Mission (2026-07-25, suite)** —
  `startMission` (`services/missionSync.ts`) insère désormais aussi une ligne `mission_events`
  (`type: 'mission_debutee'`, même type que RECA App utilise déjà pour "Débuter" côté admin) quand
  l'update `missions` a réellement touché une ligne (`.select('id')` après l'update — distingue un
  vrai premier démarrage d'un rejeu de `MISSION_STARTED` sur reconnexion, où la Mission est déjà
  `en_cours` et l'update ne touche rien). Best-effort dans un `try/catch` séparé : un échec de
  journalisation ne fait jamais échouer le démarrage réel. `created_by` posé automatiquement par
  le trigger d'audit (`auth.uid()`) → l'historique affiche le vrai opérateur comme auteur, RLS déjà
  ouverte à tout authentifié (`mission_events_insert_authenticated`, `created_by = auth.uid()`),
  aucune migration `reca-app` supplémentaire nécessaire. `tsc -b`/`npm run lint`/`npm run build`
  propres.
