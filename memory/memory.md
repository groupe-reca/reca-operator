# memory.md — Contexte permanent de `reca-operator`

> Contexte qui ne doit **jamais** être perdu entre les sessions. À lire en entier au
> début de chaque tâche (voir protocole, `CLAUDE.md` section 4).

## Client & produit

- **Client** : Groupe RECA — application **`reca-operator`**.
- **Nature** : assistant de travail **terrain** pour opérateurs (déneigement au départ).
  Ce n'est **PAS** un CRM ni une interface d'admin. Philosophie : le moins de clics
  possible, le plus d'automatisation possible. Le téléphone accompagne l'opérateur, il
  ne lui demande jamais quoi faire.
- **Généricité obligatoire** : `reca-operator` est la base des futures apps terrain Signa
  (toiture, paysagement, entretien, inspection...). **Aucune logique métier spécifique au
  déneigement** dans les composants/domaines de base.

## Marque & design

- **Calque RECA App** : stack, design et auth imitent le repo de référence
  `/var/www/html/reca-app`. L'utilisateur doit croire utiliser la même plateforme.
- **Thème SOMBRE** (RECA App est en thème clair — ne pas copier son thème). Maquette de
  référence : `.input/design.png` (elle prime sur les hypothèses tirées de reca-app).
- Typographie **Manrope**. Tokens `@theme` dans `src/styles/index.css` (surface sombre,
  accent bleu, statuts success/warning/danger, `--radius-card: 16px`). Animations via
  `motion/react`.
- **Mobile uniquement** (téléphone). Pas de tablette, pas de desktop.

## Décisions techniques (et pourquoi)

- **Stack** : React 19.2 · Vite 8 · TypeScript 6 (strict) · react-router v8 · TanStack
  Query v5 · Supabase v2 · react-hook-form + zod · motion · lucide-react · Tailwind v4
  (`@tailwindcss/vite`, tokens en CSS, pas de `tailwind.config.js`). Alias `@ → ./src`.
- **Organisation par feature** (`src/features/<f>/{pages,components,hooks,services,schemas,types,domain}`),
  calquée sur reca-app. Modules actuels : `auth`, `mission`.
- **Statuts normalisés** (`src/features/mission/domain/status.ts`) :
  `EN_ATTENTE | EN_APPROCHE | EN_COURS | TERMINE | PAUSE | ARRET`. Partagés par toute la
  plateforme Signa. Le `tone` visuel est traduit en classes par l'UI, jamais dans le domaine.
- **GPS & distances = calcul local uniquement**, aucune API externe : `useGeolocation`
  (`watchPosition`) + haversine (`domain/geo.ts`). ETA estimée à vitesse supposée 30 km/h.
  `EN_APPROCHE` déclenché sous ~10 min d'ETA ; `EN_COURS` (arrivée <20 m) **prévu mais non
  branché** (sprint futur — `ARRIVAL_RADIUS_METERS`).
- **Source de données = CSV statique** `public/demo/route.csv`, chargé au démarrage. Aucune
  base permanente pour la tournée à ce stade, aucune communication avec RECA App.
- **Parseur CSV tolérant** (`services/routeCsv.ts`) : séparateur `;` ou `,` auto-détecté,
  alias de colonnes (`lat`/`latitude`, `lng`/`longitude`), colonnes optionnelles
  (`type`, `statut`). **Pourquoi `;`** : les adresses réelles contiennent des virgules
  (`202 Rue Scott, Saint-Jérôme, QC ...`), donc le délimiteur virgule les casserait.

## Supabase & auth

- **Même projet Supabase que RECA App** : ref `ynsuxctqsvusbgcudcno`
  (`https://ynsuxctqsvusbgcudcno.supabase.co`). Même table `users`, mêmes rôles.
- Rôles : `administrateur | operateur | employe`. Le rôle `operateur` n'existe **pas
  encore** dans la table partagée.
- Clés publiques (bundle client) dans `.env.local` (gitignored) :
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_PREVIEW_MISSION`.
  Source : `.input/supabase` (gitignored).
- Se connecter exige : compte dans Supabase Auth **+** ligne `users` avec `actif=true`
  (sinon `auth.service.mapUser` rejette).

## Bypass de développement

- `?sim=1` : position GPS simulée qui converge vers le premier stop (teste `EN_APPROCHE`
  sans matériel GPS).
- `VITE_PREVIEW_MISSION="1"` (DEV only) : contourne l'auth et ouvre l'écran mission.
  `"0"` = auth réelle.

## Infra

- Serveur dev Vite sur le port **3050**. `allowedHosts: ['operator.signaweb.ca']`.
- `ecosystem.config.cjs` : PM2 sert `dist/` en SPA sur 3050 (prod).
- **Aucun test runner** configuré (ni script `test`, ni Vitest/Jest).

## Essayé / rejeté

- Le CSV de démo initial (Sprint 001) était factice : 20 « Rue Talon », séparé par
  **virgules**, colonnes `Ordre,Adresse,Latitude,Longitude,Type`. **Remplacé** (tache2)
  par la vraie route Saint-Jérôme (`.input/route.csv`, `;`, colonnes `lat`/`lng`). Ne pas
  réintroduire l'ancien format.
