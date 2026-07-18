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
  (exporte aussi `RequireRole`)
- **pages** : `pages/LoginPage.tsx`

## Module : Mission (`src/features/mission/`) — cœur de l'app

- **engine** (logique pure, hors React — Sprint 003) :
  - `engine/MissionEngine.ts` — service : GPS reçu, distances, tri par proximité, machine à
    états, chronos (horloge virtuelle), journal ; `subscribe`/`getSnapshot` (pattern store) ;
    **copie vivante des paramètres** (`config`) + `getConfig`/`setConfig` (tache5).
    Exporte `MissionSnapshot` (inclut `config`), `ActiveMissionView`, `CounterView`.
- **domain** (logique pure, générique Signa) :
  - `domain/types.ts` — `LatLng`, `GpsPosition` (avec `speed`), `Stop` (avec `problemCode`),
    `Mission`, `MissionPhase`
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
- **services** : `services/routeCsv.ts` — `loadDemoMission()` (parseur tolérant `;`/`,`) ;
  `services/attentionFixtures.ts` — `attentionNotesFor(ordre)` (consignes ATTENTION fictives)
- **hooks** :
  - `hooks/useGeolocation.ts` — GPS réel (`watchPosition` + vitesse `coords.speed`/dérivée)
  - `hooks/useMissionEngine.ts` — **adaptateur mince** : instancie l'engine, `useSyncExternalStore`,
    pousse GPS + tick 1 s, charge le CSV, simulateur `?sim=1` (cycle complet). Réexpose
    snapshot + commandes (`play`/`pause`/`stop`/`reportProblem`) + `devControls` + `config` +
    `setConfig` (tache5).
- **components** (présentationnels) : `components/SmartCounter.tsx`,
  `components/CurrentMissionCard.tsx`, `components/StopListHeader.tsx`,
  `components/StopList.tsx`, `components/StopRow.tsx`, `components/ProblemModal.tsx`
  (8 codes), `components/SettingsModal.tsx` (réglage runtime de tous les paramètres — tache5),
  `components/DevControlBar.tsx` (Play/Pause/Stop/Problème/**Réglages**, dev only),
  `components/statusTone.ts` (tone → classes)
- **pages** : `pages/MissionPage.tsx` (layout plein écran)
- **data** : `public/demo/route.csv` (source de la tournée — hors `src/`)
- **Supprimés au Sprint 003** : `MissionHeader.tsx`, `MissionCard.tsx`, `MissionFooter.tsx`,
  `TransportControls.tsx` (remplacés par SmartCounter / CurrentMissionCard / DevControlBar).

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
