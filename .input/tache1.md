# reca-operator
# Sprint 001 — Fondation de l'application opérateur

Projet : Groupe RECA - reca-operator

Version : 1.0

---

# Vision

Cette application n'est PAS un CRM.

Cette application n'est PAS une interface d'administration.

Cette application est un assistant de travail destiné aux opérateurs de déneigement.

Le téléphone ne doit jamais demander à l'opérateur quoi faire.

Le téléphone accompagne simplement l'opérateur pendant toute sa tournée.

Notre philosophie est simple :

Le moins de clics possible.

Le plus d'automatisation possible.

---

# Objectif du Sprint

Construire la fondation complète de la nouvelle application Operator.

Cette première version permettra de tester :

• l'authentification

• le chargement d'une tournée

• la détection GPS

• le changement automatique de statut

Aucune communication avec RECA App pour le moment.

Toutes les données sont temporaires.

---

# Architecture

Créer un nouveau dépôt GitHub indépendant.

Nom proposé :

reca-operator

Technologies

React

TypeScript

Vite

Supabase

Tailwind

Mapbox GL JS

Architecture identique à RECA App.

---

# Authentification

L'application utilise EXACTEMENT le même projet Supabase que RECA App.

Même Auth.

Même table utilisateurs.

Même rôles.

Créer les rôles :

Administrateur

Opérateur

Prévoir d'autres rôles dans le futur.

---

# Source des données

Pour ce sprint :

Créer un dossier :

/public/demo

Ajouter :

route.csv

Le CSV contient environ vingt propriétés.

Colonnes :

Ordre

Adresse

Latitude

Longitude

Type

Le CSV est chargé automatiquement au démarrage.

Aucune base de données permanente pour cette fonctionnalité.

---

# Interface

Style identique à RECA App.

Même palette.

Même typographie.

Même animations.

Même composants.

L'utilisateur doit avoir l'impression d'utiliser la même plateforme.

---

# Layout

L'application est plein écran.

Aucun menu.

Aucune sidebar.

Aucune navigation.

Une seule mission.

---

# Header

Toujours fixé.

Contient :

GPS actuel

Latitude

Longitude

Précision GPS

Heure

À droite :

▶ Play

⏸ Pause

■ Stop

Play et Pause utilisent le même bouton.

Stop est indépendant.

---

# Fonctionnement

Au lancement :

Tous les contrats sont :

En attente

Icône :

○ Gris

Lorsque l'utilisateur appuie sur Play :

La mission démarre.

Toutes les propriétés passent automatiquement à :

En attente

Icône :

⏳ Sablier

Le GPS commence à être surveillé.

---

# Détection GPS

Toutes les secondes :

Lire la position GPS.

Calculer la distance avec chaque propriété.

Déterminer la propriété la plus proche.

Aucune API externe.

Uniquement un calcul de distance GPS.

---

# Statuts

Les statuts doivent être normalisés.

EN_ATTENTE

EN_APPROCHE

EN_COURS

TERMINE

PAUSE

ARRET

Ces statuts seront utilisés dans toute la plateforme Signa.

---

# Détection automatique

Lorsque le système détecte que l'opérateur est à environ 10 minutes de la prochaine propriété :

Le statut devient :

EN_APPROCHE

Icône :

🟡

L'adresse remonte automatiquement en haut de la liste.

Une animation discrète attire l'attention.

Aucun clic.

---

# Arrivée

(Ce comportement sera développé dans un prochain sprint.)

Prévoir l'architecture.

Lorsque la distance devient inférieure à environ 20 mètres :

Le statut deviendra :

EN_COURS

L'écran changera automatiquement.

Ne PAS développer cette partie maintenant.

Prévoir seulement les interfaces nécessaires.

---

# Liste

Afficher uniquement :

Adresse

Statut

Temps estimé

Distance

La liste est triée automatiquement.

Toujours :

Prochaine

↓

En approche

↓

Terminées

---

# Carte

Aucune carte pour ce sprint.

Nous validons uniquement la logique GPS.

---

# Responsive

Optimiser uniquement pour téléphone.

Aucune version tablette.

Aucune version Desktop.

---

# Critères d'acceptation

✓ Nouvelle application indépendante

✓ Authentification fonctionnelle

✓ Utilisation du même Supabase que RECA App

✓ Chargement automatique du CSV

✓ Lecture GPS

✓ Affichage des coordonnées GPS

✓ Boutons Play / Pause / Stop

✓ Changement automatique du statut vers EN_APPROCHE

✓ Interface identique au style RECA App

✓ Code modulaire et documenté

---

# Important

Ne jamais développer une logique spécifique au déneigement dans les composants de base.

Toute la logique métier devra pouvoir être réutilisée dans d'autres applications Signa.

L'application Operator deviendra la base des futures applications terrain (toiture, paysagement, entretien, inspection, etc.).
