# History

## 2026-08-26

### 3D scene: nouveaux orbs
- Ajout de l'orb **Notre-Dame de la Garde** (route id "2"), en sous-dossiers par
  élément (`Basilica/`, `BellTower/`, `Fort/`, `Hill/`, `Madonna/`), puis
  chaque détail géométrique poussé un niveau plus bas (ex.
  `Basilica/Windows/index.ts`) pour suivre le même découpage que
  Corniche/Calanques.
- Ajout de l'orb **Les Calanques** (route id "3") et **La Corniche**
  (route id "4"), même style à points séparés que le Vieux-Port.
- Réutilisation du modèle de bateau du Vieux-Port (`vieux-port/boats`,
  rendu paramétrable via une prop `boats`) dans Corniche et Calanques au lieu
  de dupliquer une version simplifiée.
- Corniche : lampadaires repositionnés (ils étaient noyés dans le nuage de
  points des immeubles), parapet du bord de route détaillé (relief, pilastres),
  bord de mer ondulé aligné sur la géométrie de la falaise au lieu d'une
  ligne droite.
- Calanques : palette calcaire des falaises plus naturelle (strates,
  variation de teinte) au lieu d'un dégradé plat.

### UI Fresh Route (Expo)
- Uniformisation de la langue : tout l'écran de détail et la carte
  thermique étaient un mélange anglais/italien/français ("Fresh route",
  "Inizia Percorso", "Heat index") → tout en français.
- Mise en page desktop : les écrans étaient conçus mobile-first et
  s'étalaient de façon incohérente sur grand écran ; ajout d'une coque
  centrée à largeur maximale, grille de statistiques qui passe sur une seule
  ligne sur les écrans larges.
- Le canevas 3D et le titre se chevauchaient selon la hauteur de fenêtre ;
  fixé avec un décalage CSS fixe au lieu de dépendre de la perspective 3D.
- Ajout d'un bouton Dashboard dans la barre du haut (et d'un bouton retour
  vers Fresh Route dans le dashboard).

### Carte réelle du trajet
- L'écran de détail affichait un faux graphique en barres à la place d'une
  carte. Ajout de `RouteMapView` : version Leaflet pour le web
  (`.web.tsx`), version `react-native-maps` prête pour une build native
  (`.native.tsx`), résolues automatiquement par plateforme.
- Bug de centrage Leaflet (le conteneur n'a pas sa taille finale au montage) :
  ajout d'un `ResizeObserver` + `invalidateSize()`.

### Backend marseille-engine
- **Bug de routage corrigé** : le calcul de l'itinéraire "frais" utilisait
  `A*` avec une heuristique de distance à vol d'oiseau, qui n'est plus
  valide dès que `green_weight` réduit le poids d'une arête sous sa longueur
  réelle (jusqu'à -65%) — l'heuristique pouvait alors surestimer le coût
  réel et faire manquer le vrai meilleur chemin. Remplacé par Dijkstra
  (`nx.shortest_path`), toujours optimal, sans dépendre d'une heuristique.
- **Point de passage garanti** : nouveaux paramètres `via_lat`/`via_lon` sur
  `/route/` — calcule deux tronçons (départ→point, point→arrivée) pour
  forcer le passage par un endroit choisi.
- **Rayon du graphe routier élargi** de 3.3 km à 15 km autour du centre :
  toutes les Calanques étaient à 10-12 km du centre, donc entièrement hors
  du graphe — ces itinéraires échouaient systématiquement.

### Cohérence des données de démonstration
- Les distances/scores affichés dans la liste des itinéraires étaient des
  estimations écrites à la main, différentes de ce que calculait vraiment
  l'engine une fois sélectionné (ex. liste "1.4 km", détail "0.73 km").
  Régénéré les 28 itinéraires (7 par landmark : 3 courts, 2 à ~5 km,
  2 à ~10-12 km) en interrogeant réellement `marseille-engine` pour chacun,
  donc liste et détail affichent maintenant toujours le même nombre.

### Infrastructure (hors dépôt)
- `fresh-route/src/api/engine.ts` pointait vers `localhost:8000`, qui sur
  cette machine partagée est un service totalement différent (le vrai
  moteur tourne sur 8003). Corrigé, puis routé vers l'URL publique
  `marseille-engine.92-4-217-42.sslip.io` déjà configurée dans Traefik,
  car les navigateurs bloquent les appels d'un site public HTTPS vers
  `localhost` (Private Network Access) et ça ne fonctionnerait de toute
  façon pas pour un visiteur sur sa propre machine.
- Dashboard exposée publiquement : son port (5174) était squatté par un
  projet sans rapport sur la machine partagée ; déplacée en 5175
  (vite.config.ts, règle Traefik, port ouvert dans UFW).
