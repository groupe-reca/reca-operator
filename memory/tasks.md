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
