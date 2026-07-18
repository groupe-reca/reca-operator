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

## En cours

- (aucune)

## À faire (backlog / sprints futurs)

- [ ] **Arrivée `EN_COURS`** : brancher la détection d'arrivée (<~20 m,
  `ARRIVAL_RADIUS_METERS`) et le changement d'écran automatique. Architecture déjà prévue,
  ne pas développer avant demande explicite.
- [ ] **Rôle `operateur` dans Supabase** : la table `users` partagée ne le contient pas
  encore.
- [ ] **Carte Mapbox** : volontairement absente des sprints actuels (token présent,
  `mapbox-gl` non installé). À valider quand la logique GPS sera stabilisée.
- [ ] **Test runner** : aucun configuré ; en ajouter un avant d'écrire des tests.
