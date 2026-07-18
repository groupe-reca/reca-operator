# plans.md — Plans détaillés de `reca-operator`

> Avant toute tâche **non-triviale**, écrire ici le plan (objectif, étapes, fichiers
> touchés, risques) **avant** de coder. Archiver le plan une fois la tâche terminée
> (voir `CLAUDE.md` section 4).

---

## Archivés

### tache2 — Charger la vraie route + distances réelles ✅

- **Objectif** : charger `.input/route.csv` dans l'app, afficher les adresses réelles,
  détecter le GPS et afficher les distances réelles opérateur ↔ adresses.
- **Constat** : GPS (`useGeolocation`) et distances haversine (`domain/geo`) déjà
  fonctionnels depuis le Sprint 001. Seul écart : le loader CSV lisait un format factice
  (virgules, colonnes `Latitude/Longitude`, 20 « Rue Talon ») incompatible avec le vrai
  CSV (`;`, colonnes `lat/lng`, adresses avec virgules, accents latin1).
- **Étapes** : (1) remplacer `public/demo/route.csv` par la vraie route Saint-Jérôme,
  ré-encodée UTF-8, en conservant le format `;`. (2) Rendre `services/routeCsv.ts`
  tolérant : auto-détection du délimiteur, alias de colonnes, colonnes optionnelles.
- **Fichiers** : `public/demo/route.csv`, `src/features/mission/services/routeCsv.ts`.
- **Risques** : virgules dans les adresses (→ délimiteur `;` obligatoire) ; encodage
  latin1 → mojibake (→ réécrire en UTF-8) ; TS strict `verbatimModuleSyntax` (→
  `import type`). **Résultat** : tsc/eslint OK, 9 stops, distances vérifiées.

### tache3 — Doc CLAUDE.md + mémoire `/memory` ✅

- **Objectif** : corriger `CLAUDE.md` (obsolète) et y intégrer le contenu de tache3
  (système de mémoire + règles d'exploration). Amorcer les 4 fichiers `memory/`.
- **Étapes** : réécrire `CLAUDE.md` en sections numérotées 1→6 (4 = mémoire, 6 =
  exploration, 5 = interface intercalée pour que les renvois « section 4/6 » résolvent) ;
  créer `memory/{memory,tasks,plans,file-index}.md` avec le contenu réel du repo.
- **Fichiers** : `CLAUDE.md`, `memory/*.md`.
- **Risques** : le texte tache3 décrit des modules RECA App (Clients, Quotes...) absents
  de reca-operator → conservé verbatim comme convention, la structure réelle vit dans
  `file-index.md`.

### Sprint 003 — Automatisation intelligente des interventions ✅

- **Objectif** : transformer l'écran en assistant autonome piloté par le GPS ; extraire
  TOUTE la logique dans un service `MissionEngine` **hors React** ; machine à états réelle,
  compteur intelligent, journal des temps, modale 8 codes, mode développement.
- **Décisions client** : statut problème = `NON_TERMINE` (pas `A_REFAIRE`) ; portée =
  « logique + écran principal » (nav basse Carte/Menu et Fiche résidence détaillée reportées).
- **Étapes** : (1) domaine — `config.ts` (constantes réglables), `problemCodes.ts`, `log.ts`,
  extension `status.ts` (EN_ROUTE/DEPART/NON_TERMINE), `types.ts` (speed, problemCode),
  `geo.ts` (retrait ARRIVAL_RADIUS/APPROACH_ETA, ajout `metersPerSecondToKmh`), `format.ts`
  (`formatStopwatch`, `splitAddress`). (2) `engine/MissionEngine.ts` (classe pure, horloge
  virtuelle, machine à états, snapshot+subscribe). (3) `useMissionEngine` → adaptateur mince ;
  `useGeolocation` capte la vitesse ; simulateur `?sim=1` enrichi. (4) UI :
  `SmartCounter`, `CurrentMissionCard`, `ProblemModal`, `DevControlBar`, `statusTone.ts` ;
  refonte `StopRow`/`StopList`/`StopListHeader` ; réécriture `MissionPage` ; suppression de
  `MissionHeader`/`MissionCard`/`MissionFooter`/`TransportControls`.
- **Fichiers** : voir `file-index.md` (module Mission mis à jour).
- **Risques** : accès aux refs pendant le rendu (règle `react-hooks/refs`) → engine en
  `useState` paresseux + chargement en `useEffect` ; init statique TS2729 → `EMPTY_SNAPSHOT` au
  niveau module ; TS strict `verbatimModuleSyntax` → `import type`.
- **Résultat** : `tsc -b` OK, `eslint` OK ; cycle complet + chemin Problème vérifiés headless
  (tsx) sur le vrai moteur (délais ~30 s respectés, TERMINE retiré, NON_TERMINE conservé,
  journal des durées correct).

---

## Actifs

- (aucun pour l'instant)

> Modèle pour un nouveau plan :
>
> ### <nom de la tâche>
> - **Objectif** :
> - **Étapes** :
> - **Fichiers touchés** :
> - **Risques** :
