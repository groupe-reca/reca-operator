# file-index.md — Table de référence module → fichiers

> **À consulter AVANT toute exploration du repo** (voir `CLAUDE.md` section 6). Si un
> fichier n'y figure pas (nouveau/déplacé), mettre l'index à jour en fin de tâche.
>
> Modules actuels de `reca-operator` : **Auth**, **Mission**. (Contrairement à RECA App,
> pas de Leads/Quotes/Clients/Contrats/Factures/Paiements/Équipements/Employés/Routes/
> Paramètres — l'app opérateur est volontairement minimale : une seule mission.)

## Module : Auth (`src/features/auth/`)

- **types** : `types/auth.types.ts`
- **schemas** : `schemas/login.schema.ts`
- **services** : `services/auth.service.ts` (`signInWithPassword`, `signOut`,
  `getSession`, `mapUser` via table `users`)
- **hooks** : `hooks/useLogin.ts`, `hooks/useLogout.ts`, `hooks/useSession.ts`
  (`useQuery(['session'])` + `onAuthStateChange`)
- **components** : `components/LoginForm.tsx`, `components/RequireAuth.tsx`
  (exporte aussi `RequireRole` **et `RequireOperator`** — rend `AccessDenied` si rôle ≠ operateur ;
  `PREVIEW_BYPASS` supprimé), `components/AccessDenied.tsx` (écran « Accès refusé »)
- **pages** : `pages/LoginPage.tsx`

## Module : Mission (`src/features/mission/`) — cœur de l'app

- **engine** (logique pure, hors React — Sprint 003) :
  - `engine/MissionEngine.ts` — service : GPS reçu, distances, tri par proximité, machine à
    états, chronos (horloge virtuelle), journal ; `subscribe`/`getSnapshot` (pattern store) ;
    **copie vivante des paramètres** (`config`) + `getConfig`/`setConfig` (tache5).
    **Reprise** : `rehydrateStop` conserve les statuts terminaux persistés (`loadMission`/`play`).
    **Write-back** : émet l'événement neutre `STOP_FINALIZED {missionItemId, outcome}` depuis
    `completeActive`/`reportProblem`. Exporte `MissionSnapshot`, `ActiveMissionView`, `CounterView`.
    2026-07-29 — `MissionSnapshot` gagne **`allStops: Stop[]`** (copie non filtrée de tous les
    stops triée par `ordre`, y compris `TERMINE` et le stop actif — additif, `otherStops`
    inchangé) pour alimenter la carte Mapbox.
- **domain** (logique pure, générique Signa) :
  - `domain/types.ts` — `LatLng`, `GpsPosition` (avec `speed`/`heading`), `Stop` (avec
    `problemCode`, **`missionItemId`**, **`operatorMessage`**), `Mission` (`id: string | null` ;
    2026-07-29 — `secteur` remplacé par **`routeName`/`operatorName`/`equipmentName`**, tous
    `string | null`), `MissionPhase`
  - `domain/status.ts` — union `MissionStatus` (9 statuts), `STATUS_CONFIG`, `restingIconFor`
  - `domain/config.ts` — constantes de **défaut** : `ARRIVAL_RADIUS_METERS`, `LOW_SPEED_KMH`,
    `DEPART_SPEED_KMH`, `APPROACH_DELAY_MS`, `DEPART_DELAY_MS`, `DEV_CONTROLS` ; + type
    `EngineConfig` et objet `DEFAULT_ENGINE_CONFIG` (tache5, réglage runtime)
  - `domain/problemCodes.ts` — `PROBLEM_CODES` (8), type `ProblemCode`, `problemCodeLabel`
  - `domain/log.ts` — type `MissionLogEntry` (journal des durées)
  - `domain/geo.ts` — `haversineMeters`, `estimateEtaMinutes`, `nearestStop`,
    `metersPerSecondToKmh`, constante `ASSUMED_SPEED_KMH`
  - `domain/format.ts` — `formatCoords`, `formatAccuracy`, `formatClock`, `formatTimeOfDay`,
    `formatDistance`, `formatEta`, `formatElapsed`, `formatStopwatch`, `splitAddress`
- **services** (source de données = Supabase Mission/MissionItems) :
  - `services/missionMapping.ts` — **pur, testable** (aucun import Supabase) : `mapItemToStop`,
    `mapStatutToInternal` (lecture), `outcomeToStatut` (écriture), types `MissionItemStatut`/
    `MissionItemJoinRow`.
  - `services/missionSupabase.ts` — `loadAssignedMission()` : résout l'opérateur
    (`auth.uid → employees.user_id → missions.operator_id`), charge Mission + `mission_items`
    joints aux contrats. `null` = aucune mission assignée. 2026-07-25 — renvoie aussi `id`.
    2026-07-29 — joint aussi `employees.prenom/nom`, `routes.nom` (via `missions.route_id`) et
    `equipments.nom` (via `missions.equipment_id`, nullable) → `Mission.routeName`/
    `operatorName`/`equipmentName` (en-tête de l'écran Mission, plus de placeholder).
  - `services/missionSync.ts` — `persistItemStatus(id, statut)` : **point d'écriture unique**
    vers `mission_items` (prêt hors-ligne, ne lève jamais). 2026-07-25 — gagne `startMission(missionId)` :
    `missions.update({statut:'en_cours', heure_debut}).eq('statut','planifiee')`, idempotent, même
    convention best-effort ; journalise aussi une ligne `mission_events` (`mission_debutee`) quand
    l'update a réellement touché une ligne (pas sur un rejeu de reconnexion).
  - (**Supprimés** au sprint Intégration RECA App : `services/routeCsv.ts`,
    `services/attentionFixtures.ts`.)
- **hooks** :
  - `hooks/useGeolocation.ts` — GPS réel (`watchPosition` + vitesse `coords.speed`/dérivée)
  - `hooks/useMissionEngine.ts` — **adaptateur mince** : instancie l'engine, `useSyncExternalStore`,
    pousse GPS + tick 1 s, charge la **Mission Supabase** (`loadAssignedMission`), simulateur
    `?sim=1` (cycle complet). Réexpose snapshot + commandes + `devControls` + `config`/`setConfig`
    + **`noMission`/`isFetchingMission`/`refetchMission`** + **`missionId`** (2026-07-25) +
    **`missionLabel`/`routeName`/`operatorName`/`equipmentName`** (2026-07-29, lus directement sur
    la `Mission` chargée, pour `MissionHeaderBar`).
  - `hooks/useMissionSync.ts` — pont write-back (glue) : abonné à `engine.onEvent`, route
    `STOP_FINALIZED` → `persistItemStatus` ; expose `connectionLost` (bannière « Connexion perdue »).
    2026-07-25 — accepte aussi `missionId`, route `MISSION_STARTED` → `startMission` (démarrage
    réel de la Mission, fresh start uniquement, idempotent).
- **components** (présentationnels) : `components/MissionTopOverlay.tsx` (2026-07-29 tache6,
  **remplace `MissionHeaderBar.tsx`** — bandeau flottant, plus de bande pleine largeur : bloc
  glass Mission/Route/opérateur/équipement à gauche, `SmartCounter` (`variant="floating"`) isolé
  à droite + petite bascule vocale séparée), `components/SmartCounter.tsx` (gagne
  `variant?: 'hero' | 'pill' | 'floating'` — `floating` = gros compteur glassmorphism flottant),
  `components/CurrentMissionCard.tsx` (« Prochaine résidence » ; deux colonnes si ATTENTION ;
  2026-07-29 tache6 — restylée glassmorphism `bg-surface-card/75 backdrop-blur-md` + poignée de
  drag décorative), `components/StopListDrawer.tsx` (2026-07-29 tache6, **nouveau, remplace
  `StopListHeader.tsx` + `MissionCountersRow.tsx`** dans le flux — tiroir rétractable, replié =
  3 résidences visibles max, dépliable par tap ou glissement (`motion` `drag="y"`) sur la
  poignée, header compact avec compteurs terminées/à reprendre inline), `components/StopList.tsx`,
  `components/StopRow.tsx` (badge numéroté (`stop.ordre`) coloré par tone), `components/
  ProblemModal.tsx` (8 codes), `components/MissionOptionsSheet.tsx` (réglage runtime de tous les
  paramètres — tache5 ; 2026-07-29 tache6 — la section « Contrôle manuel » (Play/Pause/Stop) est
  de nouveau **gardée par `config.devControls`** — menu de développement cachée en prod, cf.
  `design3.txt`), `components/MapFloatingButtons.tsx` (2026-07-29 tache6, **nouveau, remplace
  `MissionFooter.tsx`** — 3 gros boutons ronds flottants sur le bord droit de la carte :
  Navigation (lien Google Maps externe vers le stop actif) / Problème / Options),
  `components/DevPanelTrigger.tsx` (2026-07-29 tache6, ajouté après coup — petit bouton discret
  en haut-gauche, rendu **uniquement si `config.devControls`**, ouvre `MissionOptionsSheet` ;
  sans lui, plus rien ne permettait d'atteindre le panneau Play/Pause/Stop une fois celui-ci
  retiré de l'écran principal — le bouton « Options » des 3 flottants ouvre le même sheet mais
  ne le met pas en avant), `components/statusTone.ts` (tone → classes Tailwind).
  - `components/map/` (module carte Mapbox, seul endroit du module Mission qui connaît
    `mapbox-gl`) : `MissionMap.tsx` (2026-07-29 tache6 — **plein écran** (`absolute inset-0`,
    plus de conteneur/marge), caméra « conduite » qui suit la position **et le cap** en continu
    (`map.easeTo`, pitch/zoom fixes `FOLLOW_PITCH`/`FOLLOW_ZOOM`), tracé GeoJSON de la route,
    marqueurs custom colorés par statut, marqueur position + halo + flèche de cap masquée si
    `heading===null`, recentrer (relance le suivi), bascule sombre/satellite via `map.setStyle`),
    `mapCameraConfig.ts` (2026-07-29 tache6, nouveau — constantes caméra UI pures : `FOLLOW_PITCH`
    58°, `FOLLOW_ZOOM` 18.5, `FOLLOW_EASE_MS`, `FOLLOW_MIN_MOVE_METERS`), `statusToneColors.ts`
    (`TONE_HEX`), `mapBounds.ts` (`boundsFromPoints`, pur), `CompassBadge.tsx` (2026-07-29 tache6 —
    l'aiguille tourne maintenant à l'**inverse** du cap appliqué à la caméra (`headingDeg` prop)
    pour continuer à pointer le vrai nord, la carte tournant désormais avec le cap — ce n'est PAS
    la boussole du téléphone, qui reste hors scope), `MapControls.tsx` (boutons flottants
    recentrer/calque, repositionnés sous `MissionTopOverlay`).
- **pages** : `pages/MissionPage.tsx` (2026-07-29 tache6, **recomposé en overlay plein écran** —
  `MissionMap` en fond (`absolute inset-0`) ; `MissionTopOverlay` + `MapFloatingButtons` +
  pile flottante du bas (bannière connexion perdue → `CurrentMissionCard`/`EmptyHero` →
  `StopListDrawer`) en `absolute` par-dessus ; plus de scroll de page (`<main>` supprimé) ;
  `ProblemModal`/`MissionOptionsSheet` montés en permanence ; branche `useMissionSync`)
- **Supprimés au Sprint 003** : `MissionHeader.tsx`, `MissionCard.tsx`, `MissionFooter.tsx` (v1),
  `TransportControls.tsx`. **Supprimé 2026-07-29 (tache4)** : `DevControlBar.tsx`. **Supprimés
  2026-07-29 (tache6, refonte carte plein écran)** : `MissionHeaderBar.tsx` (→
  `MissionTopOverlay.tsx`), `MissionFooter.tsx` (→ `MapFloatingButtons.tsx`),
  `StopListHeader.tsx` + `MissionCountersRow.tsx` (→ `StopListDrawer.tsx`).

## Module transverse : Carte (`src/lib/mapboxClient.ts`, `src/hooks/useMapboxMap.ts`,
`src/components/map/MapCanvas.tsx`) — 2026-07-29

> Mirror exact du pattern Mapbox de `reca-app` (`mapbox-gl` direct, pas de wrapper React).
> Générique — aucune connaissance du domaine Mission, réutilisable par toute future carte Signa.

- `lib/mapboxClient.ts` — `MAPBOX_TOKEN`/`isMapboxConfigured` (`VITE_MAPBOX_TOKEN`).
- `hooks/useMapboxMap.ts` — instancie `mapboxgl.Map` (style par défaut
  `mapbox://styles/mapbox/dark-v11`), try/catch autour du constructeur (token invalide → erreur
  capturée, jamais un crash), `ResizeObserver`/`instance.resize()` (conteneur à hauteur flexible).
  2026-07-29 (tache6) — accepte aussi `pitch`/`bearing` initiaux (générique, pour les cartes
  « caméra inclinée » type conduite).
- `components/map/MapCanvas.tsx` — wrapper présentationnel : repli « Carte non disponible » si pas
  de token, repli erreur, sinon rend le conteneur et appelle `onMapReady(map)`. Réexpose aussi
  `pitch`/`bearing` (2026-07-29 tache6).
- Dépendances : `mapbox-gl@^3.26.0` (+ `@types/geojson` en devDependency, nécessaire pour typer
  les objets GeoJSON passés à `addSource` sans dépendre de `@mapbox/mapbox-gl-draw`).

## Module transverse : Voix (`src/core/voice/`) — Sprint 004

> Couche d'assistance vocale (service + décideur) **générique**, sous `src/core/voice/`. Chaîne :
> `MissionEngine → (événements) → VoiceAnnouncementManager → VoiceService → TTS natif`. **Aucun
> composant React ne touche le TTS** ; seul le pont `features/mission/hooks/useVoiceBridge.ts`
> relie le moteur et la voix (utilisé par `MissionPage`).

- `core/voice/VoiceService.ts` — abstraction TTS (`speechSynthesis`), singleton `voiceService` ;
  `initialize/speak/stop/isEnabled/setEnabled/isSupported`, voix `fr-CA`. **Générique.**
- `core/voice/VoiceAnnouncementManager.ts` — décideur (**toute** la décision : catégories +
  anti-répétition), singleton `voiceAnnouncements` ; `setCategories/reset` + handlers
  `onMissionStarted/onActiveMissionChanged/onResidenceSide/onCriticalAlert/onMissionCompleted`.
  Type `VoiceCategories`. **Générique** (aucun import de `features/`).
- Le pont React vit **côté feature** : `features/mission/hooks/useVoiceBridge.ts` — init +
  sync (master + catégories depuis `config`) + abonnement `engine.onEvent` → handlers du manager ;
  retourne `testVoice()`. (Remplace l'ancien `core/voice/useVoice.ts`, **supprimé** au Sprint 005.)
- Bus d'événements : `MissionEngine.onEvent` + type `MissionEvent` (`engine/MissionEngine.ts`)
  — inclut aussi `STOP_FINALIZED` (consommé par `useMissionSync`, hors voix).
  `useMissionEngine` réexpose `subscribeEvents`.
- Réglages `voiceEnabled` + 5 catégories (`voiceStart/voiceNextAddress/voiceSide/voiceAlerts/
  voiceEnd`) dans `EngineConfig` (`domain/config.ts`) ; seuils G/D `SIDE_*` (hors UI). UI dans
  `MissionOptionsSheet` (2026-07-29, renommage de `SettingsModal` ; section « Assistance vocale » :
  master + 5 toggles + « Tester la voix »). Géométrie G/D : `domain/geo.ts` (`bearingDegrees`,
  `residenceSide`).

## Partagé / transverse

- **app / entrée** : `src/main.tsx`, `src/app/App.tsx`, `src/routes/router.tsx`
- **UI primitives** : `src/components/ui/{Button,Input,Card,Badge,Toaster}.tsx`
- **shared** : `src/components/shared/StatusBadge.tsx`
- **lib** : `src/lib/supabaseClient.ts`, `src/lib/queryClient.ts`, `src/lib/mapboxClient.ts`
  (2026-07-29, `MAPBOX_TOKEN`/`isMapboxConfigured`)
- **stores** : `src/stores/toastStore.ts` (toast via `useSyncExternalStore`)
- **hooks partagés** : `src/hooks/useBreakpoint.ts` (`useIsMobile()`), `src/hooks/useMapboxMap.ts`
  (2026-07-29, générique — mirror du hook Mapbox de `reca-app`)
- **map (générique)** : `src/components/map/MapCanvas.tsx` (2026-07-29, wrapper Mapbox
  présentationnel, aucune connaissance du domaine)
- **styles** : `src/styles/index.css` (Tailwind v4 + tokens `@theme`, thème sombre)
- **assets** : `src/assets/logo-clair.svg`, `src/assets/logo-sombre.svg`

## Config (racine)

- `vite.config.ts` (port 3050, alias `@`, plugins react + tailwind)
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` (strict)
- `ecosystem.config.cjs` (PM2, sert `dist/` sur 3050)
- `.env.local` (gitignored) / `.env.example` (2026-07-29 — documente aussi `VITE_MAPBOX_TOKEN`)
- `.input/` : specs (`tacheN.md`), maquette (`design.png`), `route.csv` source, `supabase`
