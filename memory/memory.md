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
- **Statuts normalisés** (`src/features/mission/domain/status.ts`) — étendus au Sprint 003 :
  `EN_ATTENTE | EN_ROUTE | EN_APPROCHE | EN_COURS | DEPART | TERMINE | NON_TERMINE | PAUSE |
  ARRET`. Partagés par toute la plateforme Signa. Le `tone` visuel est traduit en classes
  par l'UI (`components/statusTone.ts`), jamais dans le domaine. Icônes **génériques** (pas de
  tracteur métier). **Décision** : le statut « problème » s'appelle `NON_TERMINE` (libellé
  « Non terminé »), pas `A_REFAIRE` — choix explicite du client (le texte prime sur le libellé
  « À REFAIRE » de la maquette). Icône X rouge conservée de la maquette.
- **GPS & distances = calcul local uniquement**, aucune API externe : `useGeolocation`
  (`watchPosition`, capte aussi `coords.speed` + fallback dérivé de 2 positions) + haversine
  (`domain/geo.ts`). ETA estimée à vitesse supposée 30 km/h (affichage seulement).

- **Sprint 003 — moteur autonome (`engine/MissionEngine.ts`)** : TOUTE la logique est dans un
  **service TS pur, hors React** (GPS reçu, distances, tri par proximité, machine à états,
  chronos, journal). Le hook `useMissionEngine` n'est qu'un **adaptateur mince**
  (`useSyncExternalStore` + `subscribe`/`getSnapshot`, comme `toastStore`) qui pousse le GPS et
  un tick 1 s, et charge le CSV. Les composants sont purement présentationnels. **Ne jamais
  remettre de logique dans l'UI ou le hook.**
  - **Machine à états** (par stop) : un seul stop « engagé » à la fois = la Mission actuelle.
    `EN_ATTENTE → EN_ROUTE` (plus proche non final) `→ EN_APPROCHE` (dans le rayon)
    `→ EN_COURS` (rebours écoulé) `→ DEPART` (sorti du rayon + vitesse) `→ TERMINE` (rebours
    écoulé). `TERMINE` **retiré de la liste** ; `NON_TERMINE` (Problème) **reste dans la liste**
    jusqu'à clôture de la route. Tri **toujours par distance réelle** (plus de bascule ordre).
  - **Horloge virtuelle** : le temps n'avance que pendant `RUNNING` → la pause fige
    naturellement chronos et comptes à rebours. Journal (`domain/log.ts`) = durées réelles
    déplacement + intervention, **en mémoire seule** (pas de persistance ce sprint).
  - **Constantes réglables** dans `domain/config.ts` (jamais codées en dur) :
    `ARRIVAL_RADIUS_METERS=25`, `LOW_SPEED_KMH=3`, `DEPART_SPEED_KMH=5`, `APPROACH_DELAY_MS=30000`,
    `DEPART_DELAY_MS=30000`, `DEV_CONTROLS=true`. **Note** : l'ancien `ARRIVAL_RADIUS_METERS=20`
    et `APPROACH_ETA_MINUTES` de `geo.ts` ont été **retirés** (le rayon vit maintenant dans
    `config.ts`).
  - **Mode DÉVELOPPEMENT** (`DEV_CONTROLS`) : `true` affiche la barre Play/Pause/Stop/Problème
    et attend un Play manuel ; `false` (prod) masque la barre et **démarre automatiquement**.
- **Paramètres réglables au runtime (tache5)** : `domain/config.ts` reste la **source des
  valeurs par défaut** (constantes + `DEFAULT_ENGINE_CONFIG` + type `EngineConfig`). Le
  `MissionEngine` en tient une **copie vivante** (`config`), exposée dans `MissionSnapshot`,
  modifiée via `setConfig(patch)` (ré-évalue la machine à états si RUNNING). Réglés en direct
  via la modale `SettingsModal` (ouverte par le bouton engrenage de `DevControlBar`).
  **Runtime seulement, aucune persistance** — un rechargement rétablit les défauts. Règle
  maintenue : la logique lit `this.config.*`, jamais de valeur codée en dur ; l'UI ne fait que
  lire `snapshot.config` et appeler `setConfig`. `LOW_SPEED_KMH`/`lowSpeedKmh` est exposé mais
  **toujours pas branché** dans `evaluate()` (affiché « réservé » dans l'UI).
- **Sprint 004 — Assistance vocale (`src/core/voice/`)** : nouvelle **couche transverse
  indépendante** (hors `features/`). Chaîne imposée :
  `MissionEngine → VoiceAnnouncementManager → VoiceService → TTS natif du téléphone`.
  - **`VoiceService`** : abstraction du TTS natif (Web Speech API `speechSynthesis`, moteur
    vocal de l'OS — aucune API externe, aucune IA, aucun coût). Singleton `voiceService`.
    `initialize/speak/stop/isEnabled/setEnabled/isSupported`, voix `fr-CA`, `speak` = `cancel`
    puis `speak` (pas de file), no-op si non supporté/désactivé. **Seul point qui touche le TTS.**
  - **`VoiceAnnouncementManager`** : décideur, singleton `voiceAnnouncements`. Point de passage
    **obligatoire** des annonces (`say()` privé = futur emplacement de la logique anti-répétition).
    Méthodes : `announceMissionStarted/announceNextAddress/announceCriticalAlert/announceMissionCompleted`.
  - **RÈGLE** : **aucun composant React ne contient de logique TTS** ; ils n'importent jamais
    `VoiceService`. La glue est le hook `useVoice` (observe le snapshot, appelle le manager).
    Vérifiable par grep `speechSynthesis|VoiceService` dans `src/features` (doit être vide).
  - **Sprint 005 — annonces automatiques par événements** : le `MissionEngine` émet un **bus
    d'événements de domaine** (`onEvent(listener)` / type `MissionEvent`), **séparé du snapshot**
    et **neutre** (le moteur n'appelle jamais la voix) : `MISSION_STARTED` (play frais),
    `ACTIVE_MISSION_CHANGED {ordre,address}` (nouveau stop EN_ROUTE), `APPROACH_ENTERED {ordre,note}`
    (EN_ROUTE→EN_APPROCHE), `RESIDENCE_SIDE {ordre,side}` (fiable, 1×/engagement), `MISSION_COMPLETED`
    (tous finaux, garde `completedEmitted`).
  - **Pont** : `features/mission/hooks/useVoiceBridge.ts` s'abonne à `engine.onEvent` et **route**
    chaque événement vers un handler du manager (aucune décision dans le pont). Il **remplace**
    `core/voice/useVoice.ts` (**supprimé**) ; `useMissionEngine` expose `subscribeEvents = engine.onEvent`.
  - **Décision + anti-répétition = 100 % dans `VoiceAnnouncementManager`** : handlers
    `onMissionStarted/onActiveMissionChanged/onResidenceSide/onCriticalAlert/onMissionCompleted`,
    chacun gate sur (catégorie activée) + (déjà joué ? via `Set<ordre>`/drapeaux) ; `reset()` au
    démarrage. `onMissionStarted` appelle `reset()`. `setCategories()` reçoit les 5 flags.
  - **Gauche/droite** : `geo.residenceSide(position,target,distance)` + `geo.bearingDegrees` ;
    `heading` ajouté à `GpsPosition`, capté par `useGeolocation` (fallback dérivé du déplacement),
    simulé dans `useMissionEngine`. Retourne `null` (silence) si non fiable (cap inconnu, lent,
    trop loin, angle ambigu). Seuils : constantes `SIDE_*` dans `config.ts` (réglable en code,
    **hors UI**). NB : approche frontale (sim/route droite) → pas d'annonce de côté (normal).
  - **Réglages** : master `voiceEnabled` + **5 catégories** `voiceStart/voiceNextAddress/voiceSide/
    voiceAlerts/voiceEnd` (booléens dans `EngineConfig`, défaut `true`), activables indépendamment
    dans `SettingsModal` (section « Assistance vocale » : master + 5 toggles + « Tester la voix »).
  - **Note** : le `MissionEngine` reste **pur** (émet des événements neutres) — c'est la migration
    anticipée depuis le Sprint 004. La détection ne vit plus dans la glue mais dans le moteur.
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

- `?sim=1` : position GPS simulée. Depuis le Sprint 003, elle parcourt **tout le cycle**
  (convergence → arrêt sur place [approche + intervention] → éloignement rapide [départ] →
  stop suivant), pilotée par l'état de la mission active. Teste la machine à états complète
  sans matériel GPS.
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
