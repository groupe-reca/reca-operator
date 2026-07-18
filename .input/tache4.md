Oui. Et je pense même qu'on peut faire quelque chose d'encore plus beau que le visuel.

La bonne nouvelle, c'est que Mapbox permet déjà 80 à 90 % de ce que tu imagines. Le reste est simplement de l'interface React dessinée par-dessus la carte.

Voici comment je le vois.

1. Fond de carte satellite

Mapbox Satellite est largement suffisant.

Au lieu d'afficher seulement une capture, tu gardes une vraie carte interactive.

Zoom fluide
Rotation
Inclinaison (pitch)
Hors ligne plus tard
2. Couche des routes

On ajoute au-dessus :

noms des rues
intersections
sens des rues
petites rues résidentielles

Ça existe déjà dans les styles Mapbox.

3. Les numéros civiques

C'est la partie intéressante.

Par défaut Mapbox n'affiche pas les numéros civiques partout.

Mais il existe plusieurs solutions.

Option A (celle que je choisirais)

Créer notre propre couche.

Chaque contrat possède :

4100 Rue Talon

Latitude
Longitude

On dessine alors un petit badge :

┌─────────┐
│ 4100    │
└─────────┘

directement sur la carte.

Même chose :

4105
4110
4120

Autour.

Le résultat serait très proche de Google Maps.

Et surtout :

tu contrôles exactement ce qui est affiché.

4. La résidence actuelle

Je ne mettrais pas seulement un cercle.

Je mettrais un halo lumineux bleu.

████████████

      ◎

████████████

Puis un contour blanc.

Impossible de la manquer.

5. Les autres contrats

Je les dessinerais également.

Exemple :

4100 ✔

4105

4110

4120

4130

Les terminés deviennent verts.

Les prochains bleus.

Les problèmes rouges.

En un coup d'œil le chauffeur voit sa progression.

6. La boussole

Je pense que tu avais eu une excellente idée.

Une vraie boussole.

Pas seulement un bouton.

      N

O          E

      ▲

      S

L'icône du tracteur tourne selon l'orientation du téléphone.

Quand il arrive à un T :

Il regarde simplement.

Rue Talon

← 4100

→ 4200

Il sait immédiatement tourner à gauche.

Sans GPS vocal.

7. Ce que j'ajouterais

Un cône de vision.

          ▲

        /   \

      /       \

     🚜

Comme dans les applications militaires.

Le chauffeur voit exactement où pointe son véhicule.

8. Les zones du contrat

Lorsqu'il approche :

Les zones deviennent visibles.

██████████████

▓▓▓▓▓▓▓▓▓▓

██████████████

Stationnement.

Puis :

■■■■■■■

Trottoir

■■■■■■■

Puis :

Escalier

■■

Chaque zone possède une couleur.

L'opérateur sait immédiatement ce qu'il doit faire.

Et le mode hors ligne ?

C'est probablement ce qui me plaît le plus dans ton idée.

Mapbox permet de télécharger des tuiles pour une utilisation hors ligne (selon le SDK et le type d'application), mais pour une application comme RECA Operator, tu peux aussi préparer ton propre système de cache local des cartes de la zone de travail. Les routes de déneigement changent peu : les opérateurs travaillent toujours dans les mêmes secteurs.

Donc, avant leur quart de travail :

téléchargement du secteur complet (par exemple Saint-Jérôme Est)
toutes les cartes sont stockées localement
toutes les résidences sont déjà connues
tous les contrats sont déjà téléchargés
les zones à déneiger sont déjà présentes
les notes sont déjà présentes

Pendant la tempête, même sans réseau, l'application continue de fonctionner. Dès que la connexion revient, elle synchronise automatiquement les états des interventions.

Ce que je trouve particulièrement fort dans ton concept

Je pense que tu t'éloignes du modèle des GPS classiques.

Tu ne cherches pas à dire à l'opérateur comment conduire.

Tu cherches à lui donner une conscience spatiale de son secteur.

Un opérateur expérimenté connaît déjà les rues. Ce qui lui fait perdre du temps, ce sont les petites hésitations :

« Est-ce que le 4100 est avant ou après l'intersection ? »
« Est-ce que cette entrée est à gauche ou à droite ? »
« Où est exactement le stationnement ? »

Si l'application répond instantanément à ces questions, tu peux gagner plusieurs secondes à chaque résidence. Multiplié par 150 ou 200 interventions dans une nuit, cela représente un gain de temps significatif sans imposer une navigation vocale ou un nouveau mode de travail. C'est une approche qui s'intègre beaucoup mieux aux habitudes des opérateurs.

Inspire toi du visuel dans le fichier @.input/design-v3.png.

Reproduis exactement la maquette sauf la section à droite de la carte ainsi que les boutons qui se trouvent à l'intérieur.

