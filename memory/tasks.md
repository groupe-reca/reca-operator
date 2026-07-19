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

## Abandonnées / en suspens

- [ ] **tache4 — Carte Mapbox interactive** (`.input/tache4.md`, maquette `.input/design-v3.png`)
  Mise en pause à la demande du client. Grosse tâche : carte satellite Mapbox, badges de
  numéros civiques, halo résidence active, marqueurs colorés par statut, boussole, cône de
  vision, zones. **Conflit non tranché** : maquette v3 en **paysage** vs contrainte « mobile
  portrait ». Reprendre par cette question (orientation) + portée carte avant de coder.
  `mapbox-gl` non installé ; token présent.

## À faire (backlog / sprints futurs)

- [ ] **Rôle `operateur` dans Supabase** : la table `users` partagée ne le contient pas
  encore.
- [ ] **Carte Mapbox** : volontairement absente des sprints actuels (token présent,
  `mapbox-gl` non installé). À valider quand la logique GPS sera stabilisée.
- [ ] **Test runner** : aucun configuré ; en ajouter un avant d'écrire des tests. La
  logique du `MissionEngine` est pure (hors React) → idéale pour des tests unitaires
  (Vitest) de la machine à états.
- [ ] **Reportés du Sprint 003** (portée volontairement limitée à « logique + écran
  principal ») : barre de navigation basse (Liste/Carte/Problème/Menu) et **Fiche
  résidence** détaillée (téléphone client + bouton Problème, ouverture auto à l'arrivée,
  option désactivable) — cf. maquette `.input/design.png`.
- [ ] **Persistance du journal** : `MissionEngine` tient le journal des durées en mémoire
  seule. À synchroniser plus tard (Supabase / module Routes) pour les statistiques.
- [ ] **Notes ATTENTION réelles** : actuellement fictives (`services/attentionFixtures.ts`).
  À alimenter depuis le contrat de la résidence quand le module Routes sera branché.
- [ ] **Voix — annonces futures** (préparées, non implantées) : arrivée détectée, intervention
  commencée/terminée, résidence ignorée, retour vers une résidence problématique. Ajouter les
  événements moteur correspondants + handlers dans `VoiceAnnouncementManager` + catégories dans
  `EngineConfig`/`SettingsModal`. (Le bus d'événements et l'anti-répétition existent déjà —
  Sprint 005.)
- [ ] **Voix — accès prod aux réglages** : le toggle « Assistance vocale » n'est atteignable
  que via `SettingsModal`, ouverte par la `DevControlBar` (dev only). Prévoir un accès aux
  réglages hors mode dev. Envisager aussi un plugin TTS natif (Capacitor) derrière
  `VoiceService` si l'app est empaquetée.
