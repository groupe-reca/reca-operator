# CLAUDE.md

Ce fichier guide Claude Code (claude.ai/code) lorsqu'il travaille sur ce dépôt.

## 1. Ce que c'est

`reca-operator` est un assistant de travail terrain pour opérateurs (déneigement au
départ, mais la logique reste **générique** et réutilisable par les futures apps
Signa : toiture, paysagement, entretien, inspection...). Ce **n'est pas** un CRM ni
une interface d'administration.

Application mobile plein écran (React 19 + Vite 8 + TypeScript), **sans menu ni
navigation** : une seule mission à la fois. Philosophie : le moins de clics possible,
le plus d'automatisation possible. L'app charge une tournée, lit le GPS en continu,
calcule les distances réelles et fait évoluer automatiquement le statut des stops.

Elle calque sa stack, son design et son auth sur le repo de référence **RECA App**
(`/var/www/html/reca-app`) — l'utilisateur doit avoir l'impression d'utiliser la
même plateforme. Thème **sombre** (RECA App est en thème clair) ; voir la maquette
`.input/design.png`.

## 2. Commandes

```bash
npm run dev       # Serveur Vite (HMR) sur le port 3050
npm run build     # tsc -b (type-check) puis build de production dans dist/
npm run lint      # ESLint sur tout le repo
npm run preview   # Sert le build de production localement
```

- **Aucun test runner configuré** — pas de script `test`, pas de Vitest/Jest. En
  ajouter un avant d'écrire des tests.
- `npm run build` lance `tsc -b` d'abord : une erreur de type casse le build. Utiliser
  `npx tsc -b` seul pour un type-check rapide sans bundler.
- `ecosystem.config.cjs` est une config PM2 qui sert `dist/` en SPA sur le port 3050
  (production).

### Bypass de développement
- `?sim=1` dans l'URL : simule une position GPS qui converge vers le premier stop
  (teste la détection `EN_APPROCHE` sans matériel GPS).
- `VITE_PREVIEW_MISSION="1"` (en mode DEV uniquement) : contourne l'auth Supabase pour
  ouvrir directement l'écran mission. `"0"` = auth réelle exigée.

## 3. Architecture

Stack : **React 19.2**, **Vite 8**, **TypeScript 6** (strict), **react-router v8**
(`createBrowserRouter`), **TanStack Query v5**, **Supabase v2**, **react-hook-form + zod**,
**motion** (`motion/react`), **lucide-react**, **@fontsource/manrope**,
**Tailwind CSS v4** via `@tailwindcss/vite` (tokens `@theme` dans `src/styles/index.css`,
aucun `tailwind.config.js`).

- **TypeScript strict** (`tsconfig.app.json`) : `verbatimModuleSyntax`,
  `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`. Importer les types avec
  `import type { ... }`, ne laisser aucune liaison inutilisée — ce sont des erreurs.
  `tsc -b` construit `tsconfig.app.json` (code `src/`) et `tsconfig.node.json` (config Vite).
- **Alias** `@` → `./src` (déclaré dans `vite.config.ts` et `tsconfig.app.json`).
- **Flux d'entrée** : `index.html` → `src/main.tsx` (monte `<App>` dans `#root`,
  `StrictMode`) → `src/app/App.tsx` (`QueryClientProvider` + `RouterProvider` + `Toaster`)
  → `src/routes/router.tsx` : `/login` public, `/` (index) protégé par `RequireAuth`
  rendant `MissionPage`, `*` → redirection vers `/`.
- **Organisation par feature** sous `src/features/<feature>/` avec les couches
  `pages/`, `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `domain/`.
  Modules actuels : **`auth`** (Supabase login, `RequireAuth`/`RequireRole`) et
  **`mission`** (le cœur : chargement de tournée, GPS, moteur de statuts).
  Transverse : `src/components/ui` (Button, Input, Card, Badge, Toaster),
  `src/components/shared`, `src/lib` (`supabaseClient`, `queryClient`), `src/stores`
  (toast), `src/hooks` (`useBreakpoint`), `src/styles`.
- **Auth** : même projet Supabase que RECA App (`ynsuxctqsvusbgcudcno`), même table
  `users`, rôles `administrateur | operateur | employe`. Variables d'env dans
  `.env.local` (gitignored) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_MAPBOX_TOKEN`, `VITE_PREVIEW_MISSION`. Se connecter exige un compte dans Supabase
  Auth **+** une ligne `users` avec `actif=true`.
- **Feature `mission`** (`src/features/mission/`) :
  - `services/routeCsv.ts` — charge la tournée depuis `public/demo/route.csv`. Parseur
    tolérant : séparateur `;` ou `,` auto-détecté, alias de colonnes (`lat`/`latitude`,
    `lng`/`longitude`), colonnes optionnelles (`type`, `statut`).
  - `hooks/useGeolocation.ts` — GPS réel via `navigator.geolocation.watchPosition`.
  - `hooks/useMissionEngine.ts` — orchestrateur : charge la mission, tick 1 s, recalcule
    distance/ETA/statut, gère les phases (Play/Pause/Stop) et le tri de la liste.
  - `domain/` — `geo.ts` (haversine + ETA, aucune API externe), `status.ts` (statuts
    normalisés `EN_ATTENTE | EN_APPROCHE | EN_COURS | TERMINE | PAUSE | ARRET`,
    partagés par toute la plateforme Signa), `types.ts`, `format.ts`.
- **Assets statiques** : `public/` servi à la racine (`/demo/route.csv`). Les imports
  depuis `src/assets/` sont traités/hashés par Vite.

**Règle métier importante** : ne jamais coder de logique spécifique au déneigement dans
les composants/domaines de base. Tout doit rester réutilisable par les autres apps Signa.

## 4. Le système de mémoire (`/memory`)

Pour éviter la perte de cohérence entre les sessions et les tâches, chaque repo contient un dossier `memory/` à la racine avec quatre fichiers :

```
memory/
├── memory.md      → Contexte permanent du projet
├── tasks.md       → Liste des tâches (à faire / en cours / terminées)
├── plans.md       → Plans détaillés des fonctionnalités en cours ou à venir
└── file-index.md  → Table de référence : quels fichiers appartiennent à quel module
```

### `memory/memory.md`
Contient le contexte qui ne doit jamais être perdu :
- Nom du client, secteur, ton de marque, couleurs, typographies
- Décisions techniques prises et pourquoi (ex: "on utilise X plutôt que Y parce que...")
- Contraintes spécifiques au client
- Ce qui a été essayé et rejeté (pour ne pas relancer la même idée deux fois)

### `memory/tasks.md`
Liste de tâches à trois statuts : `[ ] à faire`, `[~] en cours`, `[x] terminée`. Chaque tâche terminée garde une courte note de ce qui a été fait.

### `memory/plans.md`
Avant toute tâche non-triviale (nouvelle section, nouvelle fonctionnalité, refonte), on y écrit d'abord le plan : objectif, étapes, fichiers touchés, risques. On implémente seulement après.

### `memory/file-index.md`
Table de référence "module → fichiers" : pour chaque module (Leads, Quotes, Clients, Contrats, Factures, Paiements, Équipements, Employés, Routes, Paramètres, Auth), la liste exacte des fichiers réels groupés par couche (`types`/`schemas`/`services`/`hooks`/`components`/`pages`), plus une section "Partagé/transverse" (`src/components/layout`, `src/components/ui`, `src/hooks`, `src/layouts`, `src/routes`, `src/lib`). C'est la référence à consulter avant toute exploration du repo (voir section 6).

### Protocole de mise à jour — OBLIGATOIRE

**Au début de chaque tâche :**
1. Lire `memory/memory.md` en entier
2. Lire `memory/tasks.md` pour voir l'état actuel
3. Si la tâche touche un module existant, consulter `memory/file-index.md` pour la liste exacte des fichiers concernés (voir section 6)
4. Si la tâche est non-triviale, écrire ou mettre à jour le plan correspondant dans `memory/plans.md` avant de coder

**À la fin de chaque tâche :**
1. Mettre à jour `memory/tasks.md` (statut + note de complétion)
2. Ajouter à `memory/memory.md` toute décision ou contrainte nouvelle qui devra être connue plus tard
3. Cocher/archiver le plan correspondant dans `memory/plans.md`
4. Si des fichiers ont été ajoutés/supprimés/déplacés dans un module, mettre à jour `memory/file-index.md` en conséquence

Ne jamais considérer une tâche "terminée" tant que ces fichiers ne sont pas à jour. Une tâche non reflétée dans `memory/` est une tâche qui n'existe pas pour la prochaine session.

## 5. Interface & conventions

- **Style identique à RECA App** : même palette, même typographie (Manrope), mêmes
  animations (`motion/react` : `AnimatePresence`, transitions `layout`), mêmes
  composants. Thème **sombre** — tokens dans `src/styles/index.css` (`@theme`,
  ex. `--color-surface-bg`, `--color-surface-card`, `--color-accent`, statuts
  success/warning/danger, `--radius-card: 16px`). Consommés via classes utilitaires
  (`bg-surface-card`, `text-text-muted`, `rounded-card`).
- **Mobile uniquement** : optimiser pour téléphone (pas de tablette ni desktop).
  Layout `100svh` + `env(safe-area-inset-*)`, correctif iOS `font-size: 16px` sur les
  champs sous 768px.
- **Layout mission** : header fixe (coordonnées GPS + précision + heure + Play/Pause/Stop),
  liste scrollable triée automatiquement (prochaine → en approche → terminées), footer fixe.
- **Statuts normalisés** : toujours utiliser l'union de `domain/status.ts`. Le `tone`
  visuel abstrait (`neutral`/`accent`/`success`/`warning`/`danger`) est traduit en classes
  par la couche UI, jamais dans le domaine.

## 6. Règles pour limiter l'exploration du repo — OBLIGATOIRE

Objectif : ne jamais redécouvrir la structure du projet à chaque tâche (coût en tokens). Règles à appliquer systématiquement :

1. **Ne pas parcourir/grep tout le repo** pour une tâche qui touche un module déjà cartographié dans `memory/file-index.md`. Pas d'exploration récursive du dépôt "au cas où".
2. **Si la tâche concerne un module connu** (ex: "corrige le module Clients"), consulter d'abord `memory/file-index.md` pour obtenir la liste exacte des fichiers de ce module, puis lire uniquement ces fichiers-là.
3. Le réflexe systématique en début de tâche est : `memory/memory.md` + `memory/tasks.md` + **`memory/file-index.md`** — pas une exploration du repo. Ces trois lectures remplacent le besoin de "chercher pour comprendre".
4. Si un fichier nécessaire n'apparaît pas dans l'index (fichier nouveau, cas réellement transverse non listé), une recherche ponctuelle reste acceptable — mais l'index doit être mis à jour ensuite (protocole de fin de tâche, section 4), jamais contourné silencieusement à chaque fois.
5. Ne pas modifier d'autres modules que celui demandé, ne pas renommer de composants existants, ne pas déplacer de fichiers, ne pas proposer une nouvelle architecture — sauf si explicitement demandé. Utiliser les composants/patterns déjà en place (voir `memory/memory.md` pour les décisions déjà prises).
