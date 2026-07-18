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

- **domain** (logique pure, générique Signa) :
  - `domain/types.ts` — `LatLng`, `GpsPosition`, `Stop`, `Mission`, `MissionPhase`
  - `domain/status.ts` — union `MissionStatus`, `STATUS_CONFIG`, `restingIconFor`
  - `domain/geo.ts` — `haversineMeters`, `estimateEtaMinutes`, `nearestStop`,
    constantes `ASSUMED_SPEED_KMH`/`APPROACH_ETA_MINUTES`/`ARRIVAL_RADIUS_METERS`
  - `domain/format.ts` — `formatCoords`, `formatAccuracy`, `formatClock`,
    `formatTimeOfDay`, `formatDistance`, `formatEta`, `formatElapsed`
- **services** : `services/routeCsv.ts` — `loadDemoMission()` (fetch
  `public/demo/route.csv` → parseur tolérant `;`/`,`)
- **hooks** :
  - `hooks/useGeolocation.ts` — GPS réel (`watchPosition`)
  - `hooks/useMissionEngine.ts` — orchestrateur (chargement, tick 1 s, recalcul
    distance/ETA/statut, phases Play/Pause/Stop, tri, simulateur `?sim=1`)
- **components** : `components/MissionHeader.tsx`, `components/MissionCard.tsx`,
  `components/StopListHeader.tsx`, `components/StopList.tsx`, `components/StopRow.tsx`,
  `components/MissionFooter.tsx`, `components/TransportControls.tsx` (Play/Pause/Stop)
- **pages** : `pages/MissionPage.tsx` (layout plein écran)
- **data** : `public/demo/route.csv` (source de la tournée — hors `src/`)

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
