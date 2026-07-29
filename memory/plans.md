# plans.md — Plans détaillés de `reca-operator`

> Avant toute tâche **non-triviale**, écrire ici le plan (objectif, étapes, fichiers
> touchés, risques) **avant** de coder. Archiver le plan une fois la tâche terminée
> (voir `CLAUDE.md` section 4).

---

## Archivés

### tache2 — Charger la vraie route + distances réelles ✅

- **Objectif** : charger `.input/route.csv` dans l'app, afficher les adresses réelles,
  détecter le GPS et afficher les distances réelles opérateur ↔ adresses.
- **Constat** : GPS (`useGeolocation`) et distances haversine (`domain/geo`) déjà
  fonctionnels depuis le Sprint 001. Seul écart : le loader CSV lisait un format factice
  (virgules, colonnes `Latitude/Longitude`, 20 « Rue Talon ») incompatible avec le vrai
  CSV (`;`, colonnes `lat/lng`, adresses avec virgules, accents latin1).
- **Étapes** : (1) remplacer `public/demo/route.csv` par la vraie route Saint-Jérôme,
  ré-encodée UTF-8, en conservant le format `;`. (2) Rendre `services/routeCsv.ts`
  tolérant : auto-détection du délimiteur, alias de colonnes, colonnes optionnelles.
- **Fichiers** : `public/demo/route.csv`, `src/features/mission/services/routeCsv.ts`.
- **Risques** : virgules dans les adresses (→ délimiteur `;` obligatoire) ; encodage
  latin1 → mojibake (→ réécrire en UTF-8) ; TS strict `verbatimModuleSyntax` (→
  `import type`). **Résultat** : tsc/eslint OK, 9 stops, distances vérifiées.

### tache3 — Doc CLAUDE.md + mémoire `/memory` ✅

- **Objectif** : corriger `CLAUDE.md` (obsolète) et y intégrer le contenu de tache3
  (système de mémoire + règles d'exploration). Amorcer les 4 fichiers `memory/`.
- **Étapes** : réécrire `CLAUDE.md` en sections numérotées 1→6 (4 = mémoire, 6 =
  exploration, 5 = interface intercalée pour que les renvois « section 4/6 » résolvent) ;
  créer `memory/{memory,tasks,plans,file-index}.md` avec le contenu réel du repo.
- **Fichiers** : `CLAUDE.md`, `memory/*.md`.
- **Risques** : le texte tache3 décrit des modules RECA App (Clients, Quotes...) absents
  de reca-operator → conservé verbatim comme convention, la structure réelle vit dans
  `file-index.md`.

### Sprint 003 — Automatisation intelligente des interventions ✅

- **Objectif** : transformer l'écran en assistant autonome piloté par le GPS ; extraire
  TOUTE la logique dans un service `MissionEngine` **hors React** ; machine à états réelle,
  compteur intelligent, journal des temps, modale 8 codes, mode développement.
- **Décisions client** : statut problème = `NON_TERMINE` (pas `A_REFAIRE`) ; portée =
  « logique + écran principal » (nav basse Carte/Menu et Fiche résidence détaillée reportées).
- **Étapes** : (1) domaine — `config.ts` (constantes réglables), `problemCodes.ts`, `log.ts`,
  extension `status.ts` (EN_ROUTE/DEPART/NON_TERMINE), `types.ts` (speed, problemCode),
  `geo.ts` (retrait ARRIVAL_RADIUS/APPROACH_ETA, ajout `metersPerSecondToKmh`), `format.ts`
  (`formatStopwatch`, `splitAddress`). (2) `engine/MissionEngine.ts` (classe pure, horloge
  virtuelle, machine à états, snapshot+subscribe). (3) `useMissionEngine` → adaptateur mince ;
  `useGeolocation` capte la vitesse ; simulateur `?sim=1` enrichi. (4) UI :
  `SmartCounter`, `CurrentMissionCard`, `ProblemModal`, `DevControlBar`, `statusTone.ts` ;
  refonte `StopRow`/`StopList`/`StopListHeader` ; réécriture `MissionPage` ; suppression de
  `MissionHeader`/`MissionCard`/`MissionFooter`/`TransportControls`.
- **Fichiers** : voir `file-index.md` (module Mission mis à jour).
- **Risques** : accès aux refs pendant le rendu (règle `react-hooks/refs`) → engine en
  `useState` paresseux + chargement en `useEffect` ; init statique TS2729 → `EMPTY_SNAPSHOT` au
  niveau module ; TS strict `verbatimModuleSyntax` → `import type`.
- **Résultat** : `tsc -b` OK, `eslint` OK ; cycle complet + chemin Problème vérifiés headless
  (tsx) sur le vrai moteur (délais ~30 s respectés, TERMINE retiré, NON_TERMINE conservé,
  journal des durées correct).

### tache5 — Réglage runtime des paramètres du moteur (bouton engrenage) ✅

- **Objectif** : ajouter un bouton dans la barre de développement ouvrant une modale qui
  règle **tous** les paramètres du module Mission (ceux de `domain/config.ts`) en direct,
  sans recompiler. Reprend le panneau « PARAMÈTRES ACTUELS » de la maquette.
- **Décision d'archi** : les constantes de `config.ts` restent la **source des défauts** ;
  le moteur en tient désormais une **copie vivante** (`config: EngineConfig`) modifiable via
  `setConfig(patch)`. Toujours zéro logique dans l'UI : la modale ne fait que lire
  `snapshot.config` et appeler `setConfig`. Runtime seulement (pas de persistance).
- **Étapes** : (1) `config.ts` — ajouter type `EngineConfig` + `DEFAULT_ENGINE_CONFIG`
  (assemblé depuis les constantes existantes). (2) `MissionEngine` — champ `config`, l'exposer
  dans `MissionSnapshot`, remplacer les constantes importées par `this.config.*`, ajouter
  `getConfig`/`setConfig` (ré-`evaluate` si RUNNING). (3) `useMissionEngine` — lire
  `devControls` depuis `snapshot.config`, réexposer `config` + `setConfig`, auto-play via
  `engine.getConfig()`. (4) `SettingsModal.tsx` (patron `ProblemModal`, bottom-sheet) : rayon,
  vitesses, délais (affichés en s ↔ ms), toggle mode développement, bouton Réinitialiser.
  (5) `DevControlBar` — bouton engrenage (prop `onSettings`). (6) `MissionPage` — état
  `settingsOpen`, branche la modale.
- **Fichiers touchés** : `domain/config.ts`, `engine/MissionEngine.ts`, `hooks/useMissionEngine.ts`,
  `components/SettingsModal.tsx` (nouveau), `components/DevControlBar.tsx`, `pages/MissionPage.tsx`.
- **Risques** : `LOW_SPEED_KMH` exposé mais **pas encore branché** dans la machine à états
  (le rester honnête dans l'UI). Inputs numériques contrôlés → garder un brouillon local pour
  permettre la saisie. Toggle « mode dev » à `false` masque la barre (donc le bouton) → note
  UX, récupérable au rechargement. TS strict `verbatimModuleSyntax` → `import type`.

### Sprint 004 — Assistance vocale (Phases 1 & 2) ✅

- **Objectif** : fondations de l'assistance vocale — un contremaître qui parle rarement.
  Couche indépendante `src/core/voice/`, TTS natif du téléphone uniquement (aucune API/IA/coût).
- **Décision client** : câblage **cycle de vie manuel** (started + completed) ; next/alert
  définies mais non déclenchées.
- **Étapes** : (1) `VoiceService` (abstraction `speechSynthesis`, singleton, gate enabled).
  (2) `VoiceAnnouncementManager` (décideur, 4 annonces, `say()` étranglement). (3) `useVoice`
  (glue : init, sync toggle, détecte début/fin depuis le snapshot). (4) `voiceEnabled` dans
  `EngineConfig` + section « Assistance vocale » (toggle + test) dans `SettingsModal` ; branche
  `useVoice` dans `MissionPage`. `MissionEngine` **inchangé**.
- **Risques** : `erasableSyntaxOnly` interdit les propriétés-paramètres de constructeur (→
  champ + assignation explicite) ; `NumericKey` de `SettingsModal` devait exclure aussi le
  booléen `voiceEnabled` (sinon TS2362) ; `react-hooks/refs` (refs seulement dans les effets) ;
  `core/` ne doit pas dépendre de `features/` (→ `useVoice` reçoit `running`, pas la phase).
- **Résultat** : `tsc -b` OK, `eslint` OK ; headless (tsx) — 4 messages exacts + gate `speak` ;
  aucun TTS dans `src/features` (grep).

### Sprint 005 — Assistance vocale Phase 3 (annonces automatiques GPS) ✅

- **Objectif** : annonces vocales entièrement automatiques pilotées par les événements du moteur
  (prochaine adresse, alerte critique à l'approche, gauche/droite, début/fin), anti-répétition,
  5 catégories réglables. Décision centralisée dans `VoiceAnnouncementManager`.
- **Étapes** : (1) bus d'événements `MissionEngine` (`onEvent`/`MissionEvent`, émissions dans
  play/selectActiveStop/evaluate/completeActive/reportProblem, `completedEmitted`). (2) géométrie
  `geo.bearingDegrees`+`residenceSide`, `heading` sur `GpsPosition`, capté par `useGeolocation` +
  simulé. (3) manager : catégories + anti-répétition (`Set<ordre>`) + handlers + `reset`.
  (4) pont `useVoiceBridge` (remplace `core/voice/useVoice.ts` supprimé) ; `useMissionEngine`
  expose `subscribeEvents`. (5) 5 flags voix dans `EngineConfig` + toggles `SettingsModal`.
- **Risques** : `NumericKey` de `SettingsModal` devait exclure les 5 nouveaux booléens (TS2362) ;
  champ write-only `missionStartedDone` (TS6133) supprimé ; couplage couches (pont côté feature,
  `core/voice` générique) ; `react-hooks/refs`.
- **Résultat** : `tsc -b` OK, `eslint` OK ; headless (tsx) — géométrie G/D, dédup+catégories,
  séquence d'événements exacte (STARTED×1, CHANGED×2, APPROACH×2, COMPLETED×1) ; grep : aucun TTS
  dans les composants.

### Sprint — Intégration RECA App (source de données Supabase) ✅

- **Objectif** : remplacer la source CSV temporaire par l'architecture officielle de RECA App —
  auth partagée, vérification du rôle opérateur, chargement automatique de la Mission assignée +
  ses MissionItems, affichage inchangé, write-back des statuts. RECA App = maître ; RECA Operator =
  terminal terrain qui ne connaît que `Mission` + `MissionItems`.
- **Décisions (validées)** : (1) faire reca-operator **+** les migrations reca-app dans une branche
  séparée (`feat/operator-integration`) ; (2) problème → statut `a_reprendre` seulement (pas de
  colonne `code_probleme`) ; (3) reprise = **conserver** les statuts terminaux persistés.
- **Réalités schéma** : `mission_items` mince (détails via jointure `contracts`) ;
  `missions.operator_id → employees(id)` (`employees.user_id` jamais peuplé → à seeder) ;
  RLS écriture admin-only (→ migration) ; rôle `operateur` absent du CHECK (→ migration).
- **Étapes reca-operator** : `missionMapping.ts` (pur) + `missionSupabase.ts` (fetch) ;
  `Stop` += `missionItemId`/`operatorMessage` ; moteur `rehydrateStop` + événement `STOP_FINALIZED` ;
  ATTENTION depuis `operatorMessage` ; `missionSync.ts` + `useMissionSync.ts` (write-back + bannière) ;
  `useMissionEngine` swap `queryFn` + `noMission`/`refetchMission` ; `RequireOperator` + `AccessDenied` ;
  écran « Aucune mission » ; suppression CSV/fixtures + `PREVIEW_BYPASS`.
- **Étapes reca-app** (repo distinct) : migration rôle `operateur` ; migration policy RLS
  `mission_items_update_operator`.
- **Risques** : `play()` re-réinitialisait via `resetStop` (→ `rehydrateStop` aussi dans `play`) ;
  `import.meta.env` indisponible sous tsx (→ maps pures isolées de `supabaseClient` pour les tests) ;
  garde mono-écran (→ `AccessDenied` rendu, pas de redirection).
- **Résultat** : `tsc -b` OK, `eslint` OK, `npm run build` OK, headless (tsx) — mappers + reprise.
  Dépend de la PR reca-app appliquée au Supabase partagé + `employees.user_id` peuplé.

### Démarrage réel de la Mission côté RECA App ✅

- **Objectif** : `reca-operator` n'écrivait jamais dans `missions` (seulement `mission_items.statut`) —
  le bouton Play ne fait démarrer que le moteur GPS local. Une session sur le repo `reca-app` a
  découvert ce repo et demandé si ce dernier avait besoin d'un câblage pour que "l'opérateur appuie
  sur démarrer → Mission `en_cours` + `heure_debut`" se reflète réellement en base.
- **Constat avant implémentation** : en production, l'engine démarre déjà **automatiquement** dès
  que la Mission assignée est chargée (`useMissionEngine.ts` : `if (!engine.getConfig().devControls)
  engine.play()`) — il n'existe **aucun bouton "Démarrer" manuel en prod** (Play/Pause/Stop ne
  vivent que dans `DevControlBar`, dev only). Le point d'accroche naturel est donc l'événement
  `MISSION_STARTED` déjà émis par `MissionEngine.play()`, mais **seulement sur un fresh start**
  (`phase IDLE|STOPPED → RUNNING`, jamais une reprise après pause) — exactement la sémantique
  voulue.
- **Étapes** :
  1. `domain/types.ts` — `Mission` gagne `id: string | null`.
  2. `services/missionSupabase.ts` — `loadAssignedMission()` renvoie `id: mission.id` (déjà
     sélectionné en base, juste pas encore transmis au domaine).
  3. `services/missionSync.ts` — nouvelle `startMission(missionId)` : `missions.update({statut:
     'en_cours', heure_debut: now()}).eq('id', missionId).eq('statut', 'planifiee')`. Le filtre
     `.eq('statut', 'planifiee')` est ce qui rend l'appel **idempotent** : à chaque rechargement
     d'app (reconnexion), le moteur est une nouvelle instance donc `MISSION_STARTED` refire, mais
     la Mission est déjà `en_cours` en base → l'update ne touche 0 ligne, `heure_debut` n'est jamais
     écrasée. Best-effort (`try/catch`, ne lève jamais), même convention que `persistItemStatus`.
  4. `hooks/useMissionEngine.ts` — expose `missionId: mission?.id ?? null` dans le retour du hook.
  5. `hooks/useMissionSync.ts` — accepte un nouveau paramètre `missionId`, branche un cas
     `event.type === 'MISSION_STARTED'` qui appelle `startMission(missionId)` (si connu) avant le
     traitement existant de `STOP_FINALIZED`.
  6. `pages/MissionPage.tsx` — passe `missionId: engine.missionId` à `useMissionSync`.
- **Fichiers touchés** : `domain/types.ts`, `services/missionSupabase.ts`, `services/missionSync.ts`,
  `hooks/useMissionEngine.ts`, `hooks/useMissionSync.ts`, `pages/MissionPage.tsx`. Aucun nouveau
  composant UI — décision explicite de ne pas ajouter de bouton "Démarrer" puisque la prod démarre
  déjà automatiquement.
- **Risques** : dépend de la policy RLS `reca-app` `missions_update_admin_or_operator` (2026-07-25,
  déjà appliquée en live) pour que l'UPDATE passe côté opérateur — sans elle, `startMission` échoue
  silencieusement (best-effort, aucun crash, mais la Mission reste `planifiee`). Découverte au
  passage : `reca-app` avait aussi une dérive de schéma non documentée (rôle `operateur` + policy
  `mission_items_update_operator` appliqués à la main le 2026-07-24, jamais committés côté
  `reca-app`) — réconciliée par une migration dédiée côté `reca-app`, voir son propre `memory/`.
- **Résultat** : `tsc -b`/`npm run lint`/`npm run build` propres (après `npm install`, `node_modules`
  absent au départ dans ce sandbox). Non testé en navigateur dans cette session (aucun serveur/compte
  de test lancé ici) — repose sur le compte de test `operateur@groupereca.ca` déjà documenté dans
  `memory/memory.md` pour une future vérification de bout en bout.

---

### tache4 (reprise) — Refonte écran Mission (`.input/design2.png`) + module carte Mapbox ✅

- **Objectif** : reprendre tache4 (carte Mapbox, en pause depuis le Sprint 003 faute
  d'orientation tranchée) — `design2.png` résout le conflit portrait/paysage. En même
  temps, aligner tout l'écran Mission sur cette nouvelle maquette : en-tête enrichi
  (Mission #, Route, opérateur, équipement, statut), carte interactive, carte
  "prochaine résidence" + panneau ATTENTION, ligne de compteurs + progression, liste
  à badges numérotés, footer à 3 actions (Problème / Annonce vocale / Plus d'options)
  qui remplace `DevControlBar` (dev-only) par un point d'entrée production.
- **Portée confirmée avec le client** (3 questions, options recommandées retenues) :
  (1) carte = MVP fidèle au design (style sombre + bascule satellite, tracé de route,
  marqueurs par statut incl. `TERMINE`, position+halo+cap, recentrer) — hors scope :
  badges civiques, cône de vision, zones, cache hors-ligne, boussole orientation
  téléphone. (2) "Plus d'options" = nouveau point d'entrée prod des réglages +
  Play/Pause/Stop (remplace `DevControlBar`). (3) En-tête branché sur de vraies
  données Supabase (pas de placeholder).
- **Recherche préalable** : `reca-app` a déjà un module Mapbox mature en prod
  (`mapbox-gl` direct, pas de wrapper React) — pattern réutilisé à l'identique :
  `lib/mapboxClient.ts` → `hooks/useMapboxMap.ts` → `components/map/MapCanvas.tsx`
  (générique, 0 connaissance domaine) → composant feature (`MissionMap.tsx`, mirror de
  `MissionMapView.tsx` de reca-app). Schéma Supabase confirmé (sans migration reca-app
  nécessaire) : `employees.prenom/nom`, `equipments.nom` (via `missions.equipment_id`,
  nullable), `routes.nom` (via `missions.route_id`, not null, plus de colonne
  `secteur` — supprimée avec l'ancien schéma v1 `routes`).
- **Étapes** : (1) moteur — `MissionSnapshot.allStops` (copie non filtrée de
  `otherStops`, additif, pour exposer aussi les stops `TERMINE` à la carte).
  (2) `domain/types.ts` `Mission` : `secteur` → `routeName`/`operatorName`/
  `equipmentName` ; `missionSupabase.ts`/`missionMapping.ts` étendus (jointures
  `routes`/`equipments`/`employees.prenom,nom`). (3) `npm install mapbox-gl` +
  `lib/mapboxClient.ts` + `hooks/useMapboxMap.ts` + `components/map/MapCanvas.tsx`
  (transverses). (4) `features/mission/components/map/` : `statusToneColors.ts`
  (hex par tone), `mapBounds.ts`, `CompassBadge.tsx` (N statique, carte jamais tournée),
  `MapControls.tsx` (recentrer + bascule satellite/sombre), `MissionMap.tsx` (tracé
  GeoJSON + marqueurs custom par statut + marqueur position/halo/flèche de cap,
  masquée si `heading===null`). (5) Redesign : `MissionHeaderBar.tsx` (nouveau),
  `CurrentMissionCard.tsx` (2 colonnes si attention), `MissionCountersRow.tsx`
  (nouveau), `StopRow.tsx`/`StopListHeader.tsx` (badge numéroté par tone, bouton
  terminal décoratif seulement — pas de reprise manuelle dans cette tâche),
  `MissionFooter.tsx` (nouveau, remplace `DevControlBar.tsx` supprimé — Annonce
  vocale = mute toggle `voiceEnabled`), `MissionOptionsSheet.tsx` (renommage
  `SettingsModal.tsx`, + Play/Pause/Stop migrés). (6) `MissionPage.tsx` recomposé.
- **Fichiers touchés** : voir `file-index.md` (à mettre à jour en fin de tâche).
- **Risques** : token Mapbox absent/invalide (ne jamais planter — `isMapboxConfigured`
  + try/catch) ; `heading===null` (stationnaire/premier fix, ne jamais figer la
  flèche) ; pas de GPS encore acquis (fit-bounds fallback) ; mission sans stops
  (défensif) ; `routeName`/`equipmentName` null (FK nullable, jamais afficher "null") ;
  carte dans un conteneur flex (pas plein écran) → `ResizeObserver`/`resize()`
  vigilant ; conflit scroll page vs pan carte à valider sur appareil réel.
- **Plan complet** : `/root/.claude/plans/sparkling-swinging-shannon.md`.
- **Résultat** : `tsc -b` OK, `eslint` OK, `npm run build` OK. `@types/geojson` ajouté en
  devDependency (nécessaire pour typer les objets passés à `addSource`, absent sinon car
  reca-operator n'installe pas `@mapbox/mapbox-gl-draw` qui le fournit transitivement côté
  reca-app). Deux ajustements en cours de route par rapport au plan initial : (1) le bouton
  « Annonce vocale » du footer a été tranché comme un mute toggle (`setConfig({voiceEnabled:
  !voiceEnabled})`) plutôt que « tester la voix », plus utile en conditions réelles ; (2) le
  bouton icône de reprise sur les lignes « à reprendre »/« terminée » de la liste reste
  décoratif (pas de flux de reprise manuelle dans le moteur — backlog, voir `tasks.md`).
  **Non vérifié en direct dans un navigateur** : pas d'identifiants de test disponibles dans
  cette session (`PREVIEW_BYPASS` supprimé, auth réelle requise) — à valider manuellement avec
  le compte `operateur@groupereca.ca` (`?sim=1`) avant de considérer le rendu visuel définitif.

---

## Actifs

- (aucun pour l'instant)

> Modèle pour un nouveau plan :
>
> ### <nom de la tâche>
> - **Objectif** :
> - **Étapes** :
> - **Fichiers touchés** :
> - **Risques** :
