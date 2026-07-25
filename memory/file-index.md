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
- **domain** (logique pure, générique Signa) :
  - `domain/types.ts` — `LatLng`, `GpsPosition` (avec `speed`/`heading`), `Stop` (avec
    `problemCode`, **`missionItemId`**, **`operatorMessage`**), `Mission` (2026-07-25 — gagne
    `id: string | null`, clé d'écriture de `startMission`), `MissionPhase`
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
    + **`noMission`/`isFetchingMission`/`refetchMission`** + **`missionId`** (2026-07-25).
  - `hooks/useMissionSync.ts` — pont write-back (glue) : abonné à `engine.onEvent`, route
    `STOP_FINALIZED` → `persistItemStatus` ; expose `connectionLost` (bannière « Connexion perdue »).
    2026-07-25 — accepte aussi `missionId`, route `MISSION_STARTED` → `startMission` (démarrage
    réel de la Mission, fresh start uniquement, idempotent).
- **components** (présentationnels) : `components/SmartCounter.tsx`,
  `components/CurrentMissionCard.tsx`, `components/StopListHeader.tsx`,
  `components/StopList.tsx`, `components/StopRow.tsx`, `components/ProblemModal.tsx`
  (8 codes), `components/SettingsModal.tsx` (réglage runtime de tous les paramètres — tache5),
  `components/DevControlBar.tsx` (Play/Pause/Stop/Problème/**Réglages**, dev only),
  `components/statusTone.ts` (tone → classes)
- **pages** : `pages/MissionPage.tsx` (layout plein écran ; écrans « Aucune mission assignée » +
  bannière « Connexion perdue » ; branche `useMissionSync`)
- **Supprimés au Sprint 003** : `MissionHeader.tsx`, `MissionCard.tsx`, `MissionFooter.tsx`,
  `TransportControls.tsx` (remplacés par SmartCounter / CurrentMissionCard / DevControlBar).

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
  `SettingsModal` (section « Assistance vocale » : master + 5 toggles + « Tester la voix »).
  Géométrie G/D : `domain/geo.ts` (`bearingDegrees`, `residenceSide`).

## Partagé / transverse

- **app / entrée** : `src/main.tsx`, `src/app/App.tsx`, `src/routes/router.tsx`
- **UI primitives** : `src/components/ui/{Button,Input,Card,Badge,Toaster}.tsx`
- **shared** : `src/components/shared/StatusBadge.tsx`
- **lib** : `src/lib/supabaseClient.ts`, `src/lib/queryClient.ts`
- **stores** : `src/stores/toastStore.ts` (toast via `useSyncExternalStore`)
- **hooks partagés** : `src/hooks/useBreakpoint.ts` (`useIsMobile()`)
- **styles** : `src/styles/index.css` (Tailwind v4 + tokens `@theme`, thème sombre)
- **assets** : `src/assets/logo-clair.svg`, `src/assets/logo-sombre.svg`

## Config (racine)

- `vite.config.ts` (port 3050, alias `@`, plugins react + tailwind)
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` (strict)
- `ecosystem.config.cjs` (PM2, sert `dist/` sur 3050)
- `.env.local` (gitignored) / `.env.example`
- `.input/` : specs (`tacheN.md`), maquette (`design.png`), `route.csv` source, `supabase`
