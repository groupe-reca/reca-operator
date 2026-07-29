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
    `EN_ATTENTE → EN_ROUTE` (**prochain non final dans l'ordre de la mission**) `→ EN_APPROCHE`
    (dans le rayon) `→ EN_COURS` (rebours écoulé) `→ DEPART` (sorti du rayon + vitesse)
    `→ TERMINE` (rebours écoulé). `TERMINE` **retiré de la liste** ; `NON_TERMINE` (Problème)
    **reste dans la liste** jusqu'à clôture de la route.
  - **Ordonnancement = ordre de la mission, PAS la distance GPS** (décision client, révisée
    2026-07-25) : la sélection du stop actif (`nextSelectableInOrder`) et le tri de la liste
    (`otherStops`) suivent `ordre` (rang `created_at` des `mission_items`). Les distances GPS ne
    servent **que** la machine à états (détection d'arrivée/départ), jamais l'ordonnancement.
    ⚠️ **Ancien comportement rejeté** : tri par proximité (« plus proche non final ») — ne pas
    réintroduire.
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
    `initialize/speak/stop/isEnabled/setEnabled/isSupported/getVoiceName`, langue `fr-CA`,
    `speak` = `cancel` puis `speak` (pas de file), no-op si non supporté/désactivé. **Seul point
    qui touche le TTS.**
  - **Sélection de la voix (qualité)** : `pickVoice()` ne prend PAS la première voix fr venue
    (souvent la voix compacte robotique) mais celle au **score** le plus élevé — marqueurs
    `premium`/`enhanced`/`neural` (+100), `siri` (+60), noms de qualité connus
    (amélie/thomas/aurélie/… +30), `fr-CA` (+10, Québec), `localService` (+5). L'opérateur doit
    **installer** une voix « Premium/Enhanced » sur l'appareil (iOS/macOS) ; elle est alors
    détectée automatiquement. Nom retenu affiché dans `SettingsModal` (« Voix : … ») via
    `useVoiceBridge` → `getVoiceName()`.
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
- **Source de données = Supabase Mission/MissionItems (RECA App)** — depuis le sprint
  « Intégration RECA App », le CSV statique est **supprimé** (voir « Essayé/rejeté »). RECA App
  est le **système maître** ; RECA Operator est un simple terminal terrain qui ne connaît que
  `Mission` + `MissionItems` (jamais Contrats/Clients/Routes en tant que modules).
  - **Chaîne de résolution de l'opérateur** : `auth.uid()` == `users.id` == `employees.user_id`
    → `employees.id` == `missions.operator_id`. ⚠️ `employees.user_id` est **nullable et jamais
    peuplé par reca-app** → doit être renseigné en **données** pour qu'une mission soit trouvée
    (ce n'est pas une migration). `missions.operator_id` pointe `employees`, **pas** `users`.
  - **`mission_items` est une jointure mince** (`mission_id`, `contract_id`, `statut`) : adresse,
    GPS, client et **`message_operateur`** vivent sur le **contrat** → récupérés par jointure
    `contracts(adresse_geocodee, latitude, longitude, message_operateur, client:clients(...))`.
    `ordre` = rang des items triés par `created_at` (on ne lit jamais `route_contracts`) : il
    **définit la séquence de la tournée**, qui pilote la sélection du stop actif et l'ordre de la
    liste (révision 2026-07-25, cf. « Ordonnancement » plus haut).
  - **`message_operateur` (contrat) = source des notes ATTENTION** (remplace les fixtures
    `attentionFixtures.ts`, supprimées). Une seule chaîne → `attention = [message]` ou `[]`.
  - **Correspondance des statuts** (`services/missionMapping.ts`, **pur, testable**) :
    lecture `terminee→TERMINE`, `a_reprendre|impossible→NON_TERMINE`, `en_attente|en_cours→EN_ATTENTE` ;
    écriture `TERMINE→terminee`, `NON_TERMINE→a_reprendre`. **Décision** : pas de colonne
    `code_probleme` (le problème mappe vers le statut seulement — le code exact n'est pas persisté).
  - **Reprise** : au chargement, les statuts **terminaux** persistés sont **conservés**
    (`loadMission`/`play` utilisent `rehydrateStop`, pas `resetStop`) — une résidence déjà faite
    ne se refait pas ; les non-terminaux repartent `EN_ATTENTE` (repilotés par le GPS).
  - **Write-back** : point de passage **unique** `services/missionSync.persistItemStatus`
    (prêt pour une future file hors-ligne). Le moteur reste **pur** : il émet un événement neutre
    `STOP_FINALIZED {missionItemId, outcome}` depuis `completeActive`/`reportProblem` ; le pont
    `hooks/useMissionSync.ts` route → écriture Supabase et pilote la bannière « Connexion perdue ».
  - **Accès réservé aux opérateurs** : garde `RequireOperator` (dans `RequireAuth.tsx`) rend
    `AccessDenied` si `role !== 'operateur'` (pas de redirection, app mono-écran). Le
    **`PREVIEW_BYPASS` a été supprimé** (le « système temporaire » d'auth à retirer). Écran
    « Aucune mission assignée » + bouton Actualiser quand `loadAssignedMission()` renvoie `null`.
  - **Dépendances côté reca-app** (repo distinct, branche `feat/operator-integration`, 2 migrations) :
    (1) élargir le CHECK `users.role` à `'operateur'` ; (2) policy RLS `mission_items_update_operator`
    (l'opérateur assigné peut écrire `statut` de sa mission). **Sans ces migrations appliquées au
    Supabase partagé**, personne ne passe le garde et le write-back échoue (RLS admin-only).

## Supabase & auth

- **Même projet Supabase que RECA App** : ref `ynsuxctqsvusbgcudcno`
  (`https://ynsuxctqsvusbgcudcno.supabase.co`). Même table `users`, mêmes rôles.
- Rôles : `administrateur | operateur | employe`. Le rôle `operateur` est **ajouté par une
  migration reca-app** (branche `feat/operator-integration`) ; tant qu'elle n'est pas appliquée
  au Supabase partagé + attribuée à un compte, aucun utilisateur ne passe le garde `RequireOperator`.
- Clés publiques (bundle client) dans `.env.local` (gitignored) :
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_PREVIEW_MISSION`.
  Source : `.input/supabase` (gitignored).
- Se connecter exige : compte dans Supabase Auth **+** ligne `users` avec `actif=true`
  (sinon `auth.service.mapUser` rejette).
- **État du Supabase partagé (au 2026-07-24)** : les 2 migrations d'intégration (rôle `operateur`
  + policy `mission_items_update_operator`) sont **appliquées** (via SQL Editor). Compte de test
  **`operateur@groupereca.ca`** = rôle operateur, `employees.user_id` lié, une **mission #1**
  (planifiee) avec 3 MissionItems à Saint-Jérôme (dont 2 avec `message_operateur`). Ne pas
  supprimer ces données de test.
- ⚠️ **Dérive de schéma reca-app sur ce projet** : la table **`public.routes` n'existe pas**
  (probablement `routes_v2` non appliquée / routes v1 droppée en cascade), alors que `missions`
  et `route_contracts` y référaient. Sans conséquence pour reca-operator (il n'utilise jamais
  `routes`) ; le seed de mission de test met un `route_id` synthétique (`gen_random_uuid()`, plus
  de FK). À corriger côté **reca-app** (appliquer `routes_v2`) quand pertinent.

## Bypass de développement

- `?sim=1` : position GPS simulée. Depuis le Sprint 003, elle parcourt **tout le cycle**
  (convergence → arrêt sur place [approche + intervention] → éloignement rapide [départ] →
  stop suivant), pilotée par l'état de la mission active. Teste la machine à états complète
  sans matériel GPS.
- ~~`VITE_PREVIEW_MISSION`~~ : le bypass d'auth `PREVIEW_BYPASS` a été **supprimé** au sprint
  « Intégration RECA App » (le prompt exige de retirer le système temporaire). Tester en direct
  exige désormais un vrai compte **opérateur** (rôle attribué + `employees.user_id` lié + mission
  assignée). `?sim=1` reste disponible pour piloter le GPS une fois connecté.

## Infra

- Serveur dev Vite sur le port **3050**. `allowedHosts: ['operator.signaweb.ca']`.
- `ecosystem.config.cjs` : PM2 sert `dist/` en SPA sur 3050 (prod).
- **Aucun test runner** configuré (ni script `test`, ni Vitest/Jest).

## Suivi (2026-07-25) — démarrage réel de la Mission + réconciliation reca-app

- **`missions.statut`/`heure_debut` sont désormais mis à jour par `reca-operator` lui-même** au
  premier démarrage réel de la tournée (`services/missionSync.ts` → `startMission`, appelée depuis
  `hooks/useMissionSync.ts` sur l'événement `MISSION_STARTED` du moteur). Avant cette tâche, seul
  `mission_items.statut` était écrit — la Mission elle-même ne passait jamais à `en_cours` depuis
  ce repo (seul un compte admin `reca-app` pouvait le faire manuellement).
- **Aucun nouveau bouton "Démarrer"** : la prod démarre déjà le moteur automatiquement dès que la
  Mission assignée est chargée (`useMissionEngine.ts`) — `MISSION_STARTED` (émis seulement sur un
  vrai fresh start, jamais une reprise après pause) était déjà le bon point d'accroche.
  `startMission` est idempotent par construction (`.eq('statut', 'planifiee')`) : rejouée à chaque
  reconnexion/rechargement sans jamais écraser `heure_debut` une fois la Mission déjà `en_cours`.
- **Historique de Mission** : `startMission` insère aussi une ligne `mission_events` (`type:
  'mission_debutee'`, même type déjà utilisé par RECA App pour "Débuter" côté admin — un seul
  vocabulaire d'événements, l'onglet Historique de la fiche Mission côté `reca-app` affiche donc
  cette ligne comme n'importe quelle autre) — seulement quand l'update de `missions` a réellement
  touché une ligne (`.select('id')` après l'update), jamais sur un rejeu de reconnexion. Best-effort
  dans un `try/catch` dédié : un échec de journalisation ne bloque jamais le démarrage réel de la
  tournée. `created_by` posé par le trigger d'audit (`auth.uid()`) → l'auteur affiché est le vrai
  opérateur, pas un "Système" fictif.
- **Dérive de schéma découverte et réconciliée côté `reca-app`** : le rôle `users.role = 'operateur'`
  et la policy `mission_items_update_operator` documentés ci-dessus (section "État du Supabase
  partagé au 2026-07-24") avaient été appliqués **à la main** via l'éditeur SQL, sur une branche
  `feat/operator-integration` qui n'existe dans **aucun** historique git de `reca-app` — dérive de
  schéma jamais committée. Réconciliée par une migration dédiée côté `reca-app`
  (`20260725020000_reconcile_operator_role_and_policies.sql`) qui rend ces 2 changements idempotents
  et retire la policy ad hoc (doublon avec `missions_update_admin_or_operator`/
  `mission_items_update_admin_or_operator`, ajoutées côté `reca-app` le même jour pour permettre à
  l'opérateur assigné d'écrire sur `missions`/`mission_items` sans policy dédiée à `reca-operator`).
  **Piège à retenir** : une note "appliqué via l'éditeur SQL" dans ce `memory/` n'est une garantie
  de rien côté `reca-app` tant qu'aucune migration correspondante n'y est committée — toujours
  vérifier par un `git log`/`grep` dans le repo `reca-app` avant de supposer qu'un changement partagé
  est documenté des deux côtés.

## Suivi (2026-07-29) — Refonte écran Mission + module carte Mapbox (tache4 reprise)

- **Nouveau design de référence** : `.input/design2.png` — remplace `design.png` comme cible
  visuelle de l'écran Mission (portrait, résout le conflit paysage de l'ancien `design-v3.png`,
  qui n'existe d'ailleurs plus dans `.input/`). `design.png` reste la maquette du **thème
  sombre**/tokens d'origine (toujours valide), `design2.png` ajoute la carte + le nouveau layout.
- **Carte Mapbox = MVP, portée volontairement limitée** (confirmé client) : style sombre
  (`dark-v11`) + bascule satellite, tracé de route, marqueurs colorés par statut (incl.
  `TERMINE`), position GPS + halo + flèche de cap, recentrer. **Hors scope, backlog** : badges
  de numéros civiques, cône de vision, zones de contrat, cache hors-ligne, boussole pilotée par
  l'orientation réelle du téléphone (le badge « N » actuel est statique, la carte ne tourne
  jamais — `map.rotateTo` n'est appelé nulle part).
- **Architecture carte = mirror exact de `reca-app`**, pas une invention indépendante :
  `mapbox-gl@^3.26.0` en direct (pas de `react-map-gl`/`maplibre`), 3 couches génériques
  (`lib/mapboxClient.ts` → `hooks/useMapboxMap.ts` → `components/map/MapCanvas.tsx`, aucune
  connaissance du domaine) puis un composant feature (`features/mission/components/map/
  MissionMap.tsx`) qui seul connaît `Stop`/`MissionStatus`. `@types/geojson` a dû être ajouté en
  devDependency explicite (absent par défaut ici, car `reca-app` l'obtient **transitivement**
  via `@mapbox/mapbox-gl-draw`, que reca-operator n'installe pas).
- **Perf carte vs fréquence GPS** : `MissionSnapshot` (et donc `allStops`) est une **nouvelle
  référence d'objet à chaque fix GPS** (`recomputeDistances()` recrée les `Stop` à chaque
  `updatePosition`), potentiellement plusieurs fois par seconde. `MissionMap.tsx` ne dépend
  **jamais** directement de `stops` dans ses `useEffect` de tracé/marqueurs — il calcule des clés
  mémorisées (`routeKey` = ordre+coordonnées, `markersKey` = ordre+statut) qui ne changent que
  quand quelque chose de visuellement pertinent change, évitant de recréer tracé/marqueurs à
  chaque fix GPS (seul le marqueur de position, qui doit bouger à chaque fix, dépend de
  `position` directement). **Ne pas** faire dépendre ces effets de `stops` brut sans clé stable —
  ça recréerait tous les marqueurs plusieurs fois par seconde.
- **`MissionSnapshot.allStops`** (additif) : `otherStops` reste la liste filtrée utilisée par
  `StopList` (masque `TERMINE` + le stop actif, décision produit inchangée) ; `allStops` est la
  copie complète triée par `ordre` utilisée uniquement par la carte, qui a besoin de dessiner
  aussi les stops terminés (marqueurs verts). Toujours garder cette distinction : ne jamais faire
  filtrer `allStops`, ne jamais faire dessiner `otherStops` sur la carte.
- **En-tête branché sur de vraies données Supabase** (plus de placeholder `secteur: ''`) :
  `Mission.routeName`/`operatorName`/`equipmentName` viennent de jointures ajoutées à
  `missionSupabase.loadAssignedMission()` (`routes.nom` via `missions.route_id`, `equipments.nom`
  via `missions.equipment_id` nullable, `employees.prenom`/`nom`). Aucune migration `reca-app`
  nécessaire — schéma déjà confirmé présent (voir recherche du 2026-07-29 dans ce suivi : `routes`
  v2 n'a **plus** de colonne `secteur`, remplacée par un simple `nom` libre ; le concept de
  véhicule/tracteur vit dans la table générique `equipments`, pas une colonne dédiée). `operatorName`
  formaté `"Prénom N."` (ex. "Pierre G.") à l'affichage, pas stocké ainsi en base.
- **Footer/réglages redessinés** : `DevControlBar.tsx` **supprimé** — son contenu (Play/Pause/
  Stop) migre dans `MissionOptionsSheet.tsx` (renommage de `SettingsModal.tsx`), désormais
  accessible en **production** (plus de gate `devControls` sur l'ouverture). Nouveau
  `MissionFooter.tsx` toujours visible : Problème (inchangé), **Annonce vocale** = bascule rapide
  mute/unmute (`setConfig({voiceEnabled: !voiceEnabled})` — décision prise pour lever l'ambiguïté
  de la maquette, plus utile en conditions réelles qu'un simple test de diagnostic, qui reste
  disponible dans la feuille « Plus d'options »), Plus d'options (ouvre la feuille). `config.devControls`
  reste dans `EngineConfig` mais ne gate plus aucune UI — seulement son rôle d'origine (auto-play
  en prod vs attente d'un Play manuel).
- **Bouton de reprise décoratif** : les lignes « à reprendre »/« terminée » de la liste affichent
  désormais une icône dédiée (check vert / refresh orange) au lieu du chevron, fidèle à
  `design2.png`, mais **aucune action n'y est câblée** — le moteur n'a pas de mécanisme de reprise
  manuelle d'un stop déjà finalisé (seul le GPS peut ré-engager un stop non final via `ordre`).
  Backlog séparé si le besoin se confirme.
- 🐞 **Bug trouvé au 1er test réel sur téléphone (2026-07-29, corrigé)** : `TypeError: Cannot read
  properties of undefined (reading 'lng')` (stack `addTo → _update → smartWrap`) au moment du Play,
  écran d'erreur react-router plein écran. Cause : `MissionMap.tsx` créait le marqueur de position
  avec `new mapboxgl.Marker({element}).addTo(map)` **puis** `setLngLat` — or Mapbox GL projette le
  marqueur dès `addTo` et lit `this._lngLat.lng` (encore `undefined`). **Règle Mapbox GL à retenir :
  toujours `setLngLat()` AVANT `addTo()`** (les marqueurs de stops, eux, chaînaient déjà dans le bon
  ordre). Ne se déclenchait qu'au Play parce que `position` reste `null` tant que le GPS (réel ou
  `?sim=1`, produit par le tick du moteur) n'a pas émis de fix — l'effet sortait avant de créer le
  marqueur.
- 🐞 **Contrat non géocodé placé à (0, 0) (2026-07-29, corrigé)** : `mapItemToStop` faisait
  `Number(contract?.latitude)` — or **`Number(null)` vaut `0`** (et passe `Number.isFinite`), seul
  `Number(undefined)` donne `NaN`. Le filtre de `loadAssignedMission` n'écartait donc que les items
  **sans contrat joint**, pas ceux dont le contrat existe avec `latitude/longitude` à `null` : le
  stop atterrissait au large de l'Afrique et, l'ordonnancement suivant `ordre`, **bloquait la
  tournée** (prochain stop engagé que le GPS ne peut jamais atteindre ; seul le bouton Problème
  débloquait). Corrigé par un helper `toCoordinate()` (`null`/`undefined` → `NaN`) qui rend ces
  items filtrables comme les autres. **Décision maintenue** : un stop sans coordonnées est écarté
  de la tournée (la machine à états est pilotée par le GPS) — il reste donc invisible pour
  l'opérateur, et `ordre` (calculé avant le filtre) garde un trou dans la numérotation, ce qui
  correspond au rang réel côté RECA App. Le vrai correctif de fond est côté **données** : géocoder
  le contrat dans RECA App.
- ⚠️ **Non vérifié en direct dans un navigateur** : `tsc -b`/`eslint`/`npm run build` sont propres,
  mais aucun test manuel avec un vrai compte (`operateur@groupereca.ca`) n'a été fait dans cette
  session (identifiants non disponibles, `PREVIEW_BYPASS` supprimé). À faire avant de considérer
  le rendu visuel définitif — en particulier le comportement tactile scroll-page vs pan-carte sur
  appareil réel, et la lisibilité du panneau ATTENTION à deux colonnes sur un petit écran.

## Suivi (2026-07-29, suite) — Refonte « système embarqué tracteur » (tache6, `.input/design3.png`/`.txt`)

- **Nouveau design de référence** : `.input/design3.png`/`.txt` — remplace `design2.png` comme
  cible de l'écran Mission (la carte plein écran est désormais l'élément **unique et permanent**
  de l'interface, tout le reste flotte par-dessus). `design.png` reste la référence du thème
  sombre d'origine (tokens), `design2.png` documente l'étape intermédiaire (carte encadrée +
  liste scrollable), **remplacée** par cette refonte — ne pas revenir à ce layout encadré.
- **Caméra « conduite »** : `MissionMap.tsx` suit désormais la position GPS **et** le cap
  (`position.heading`) en continu via `map.easeTo` (pitch fixe `FOLLOW_PITCH=58°`, zoom fixe
  `FOLLOW_ZOOM=18.5`, constantes dans `components/map/mapCameraConfig.ts`, UI pure — pas dans
  `domain/`). **Décision** : ce n'est **pas** la boussole du téléphone (capteur d'orientation),
  qui reste hors scope (voir backlog `tasks.md`) — c'est le cap de déplacement déjà calculé pour
  la voix (`Sprint 005`). Un seuil `FOLLOW_MIN_MOVE_METERS` évite le tremblement de caméra au GPS
  bruité à l'arrêt. `CompassBadge` tourne maintenant à l'**inverse** du cap appliqué (props
  `headingDeg`) pour continuer à pointer le vrai nord pendant que la carte tourne — avant cette
  tâche le badge était statique car la carte ne tournait jamais.
- **Interface = carte plein écran + éléments flottants**, plus aucun conteneur/scroll de page :
  `MissionPage.tsx` n'a plus de `<main>` scrollable — tout est `absolute` par-dessus `MissionMap`
  (`absolute inset-0`). Composants renommés/remplacés en conséquence (ancien → nouveau) :
  `MissionHeaderBar` → `MissionTopOverlay` (bandeau flottant, plus de bande pleine largeur) ;
  `MissionFooter` → `MapFloatingButtons` (3 gros boutons ronds à droite : Navigation/Problème/
  Options, fidèle au texte de la maquette) ; `StopListHeader`+`MissionCountersRow` →
  `StopListDrawer` (tiroir rétractable, 3 résidences visibles repliées, dépliable par tap/drag).
  **Décision de portée** (`MissionCountersRow` n'a pas d'équivalent texte/image) : fusionné dans
  l'en-tête du tiroir plutôt que supprimé, pour ne pas perdre l'info terminées/à reprendre.
- **Compteur intelligent isolé** (`SmartCounter`, nouveau `variant="floating"`) : gros, coloré
  selon l'état (vert/orange/bleu/rouge via `TONE_CLASSES` existant, aucun nouveau mapping de
  couleur), **seul** en haut-droite — la bascule vocale rapide (mute) est volontairement une
  petite icône **séparée**, pas collée au compteur, pour respecter « aucun autre élément autour »
  du texte tout en conservant la fonctionnalité (décidée utile en tache4).
- **Menu de développement de nouveau caché** : la section « Contrôle manuel » (Play/Pause/Stop)
  de `MissionOptionsSheet` est de nouveau gardée par `config.devControls` (elle ne l'était plus
  depuis tache4, qui en avait fait un point d'entrée production sans gating). Cette tâche
  **réintroduit** le gating car le texte de `design3.txt` est explicite (« menu de développement
  caché », « aucun bouton technique » en interface finale). `config.devControls` reste `true` par
  défaut dans `domain/config.ts` (non changé par cette tâche) : à mettre à `false` pour un vrai
  déploiement terrain sans ces boutons.
- **Glassmorphism** : toutes les cartes flottantes (`MissionTopOverlay`, `SmartCounter
  variant="floating"`, `CurrentMissionCard`, `StopListDrawer`, `MapControls`, `CompassBadge`)
  utilisent `bg-surface-card/NN` + `backdrop-blur-md` + `border-white/10` plutôt que les surfaces
  opaques `bg-surface-card`/`border-border-subtle` d'avant — cohérent avec l'effet « verre léger »
  demandé. Pas de nouveaux tokens `@theme` : opacité + blur suffisent avec les couleurs existantes.
- ⚠️ **Non vérifié en direct dans un navigateur** (même limitation que tache4 : pas de compte de
  test/serveur dans cette session). `tsc -b`/`eslint`/`npm run build` propres seulement. À valider
  manuellement en priorité : fluidité de `map.easeTo` répété à chaque fix GPS (pas de saccades),
  geste de glissement du tiroir vs tap (ne doivent pas se percuter), lisibilité du texte flottant
  par-dessus une carte satellite claire (bascule de style).

## Suivi (2026-07-29, suite) — Bug carte invisible + outillage Playwright pour vérification visuelle

- **`MissionMap.tsx` codait en dur `relative overflow-hidden`** puis concaténait le `className` de
  l'appelant sans jamais l'avoir remis en question depuis que tache6 lui passe `absolute inset-0`
  (plein écran). `.relative`/`.absolute` sur le même élément → conflit gagné par `.relative` (déclaré
  après `.absolute` dans le CSS généré par Tailwind, même spécificité) → la carte ne remplissait
  plus l'écran, elle s'effondrait à ~28px (hauteur de l'attribution Mapbox). **Règle à retenir** :
  ne **jamais** figer une classe `position:*` en dur dans un composant si l'appelant peut aussi en
  passer une via `className` — laisser l'appelant la fournir entièrement, sinon Tailwind ne garantit
  aucun ordre de priorité entre deux utilitaires de même spécificité qui se contredisent.
- **Couche z-index des contrôles flottants** : `MissionTopOverlay`, `MapFloatingButtons`,
  `DevPanelTrigger`, `MapControls`, `CompassBadge` sont tous `z-30` (« chrome » toujours visible) ;
  la pile de cartes du bas (`CurrentMissionCard`/`StopListDrawer`/bannières) reste `z-20` (« contenu »).
  Règle établie par ce bugfix : ne jamais remettre du contenu à `z-30` ou plus sans une bonne raison,
  sinon il recouvrira les boutons persistants.
- **Playwright installé en devDependency** (+ Chromium headless via `npx playwright install
  --with-deps chromium`) pour permettre une vérification visuelle réelle sur ce VPS **sans GUI**.
  L'extension navigateur « Claude in Chrome » ne fonctionne **pas** ici : elle exige un vrai Chrome
  avec l'extension sur la **même machine** que la session Claude Code (connexion locale) — inutile
  quand Chrome est sur l'ordinateur personnel de l'utilisateur et Claude Code sur ce VPS distant.
  Playwright, lui, lance son propre navigateur headless, sans dépendance à une session utilisateur.
- ⚠️ **Piège de ports sur ce VPS partagé** : `127.0.0.1:3030` répond mais c'est le process **PM2**
  de production (`pm2 list` → `reca-operator`, sert `dist/`), pas un `npm run dev`. Un `npm run dev`
  lancé alors que 3030/3031 sont déjà occupés (par PM2 et/ou un autre process vite résiduel) atterrit
  sur le port suivant disponible (3032 rencontré) — **toujours vérifier `ss -ltnp`/`pm2 list` et lire
  le log de démarrage de Vite** avant de pointer un outil de test sur un port « par défaut ».
- **Prod PM2 mise à jour (2026-07-29)** : après accord explicite de l'utilisateur, `npm run build` +
  `pm2 restart reca-operator` — le port 3030 sert désormais le bundle avec le correctif carte
  (vérifié : `index-BvdCb9vU.js` servi par `curl http://127.0.0.1:3030/`).

## Essayé / rejeté

- Le CSV de démo initial (Sprint 001) était factice : 20 « Rue Talon », séparé par
  **virgules**, colonnes `Ordre,Adresse,Latitude,Longitude,Type`. **Remplacé** (tache2)
  par la vraie route Saint-Jérôme (`.input/route.csv`, `;`, colonnes `lat`/`lng`). Ne pas
  réintroduire l'ancien format.
- **Toute la source CSV** (`public/demo/route.csv`, `services/routeCsv.ts` + parseur tolérant,
  `services/attentionFixtures.ts`) a été **supprimée** au sprint « Intégration RECA App » :
  la tournée vient désormais de Supabase (Mission/MissionItems). Ne pas réintroduire de CSV —
  la source de vérité est RECA App.
