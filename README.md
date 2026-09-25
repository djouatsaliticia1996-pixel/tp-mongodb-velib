# TP MongoDB — Analyse des stations Vélib' avec Navicat Premium

Analyse des **données Vélib' en temps réel** (1 519 stations d'Île-de-France) : import dans MongoDB via Navicat Premium, nettoyage des stations inutilisables, puis agrégation du nombre de stations et de vélos disponibles **par commune**.

## Outils

| Outil | Rôle |
|---|---|
| MongoDB (localhost:27017) | Base de données NoSQL orientée documents |
| Navicat Premium | Interface graphique : connexion, import, requêtes |
| Excel | Lecture du résultat exporté en CSV |
| Git / GitHub | Versionnement et publication du projet |

## Contenu du dépôt

```
tp-mongodb-velib/
├── README.md                     ← ce fichier
├── Recapitulatif_TP_MongoDB.txt  ← récapitulatif détaillé du TP
├── requetes_mongodb.js           ← toutes les requêtes exécutées
├── resultat_par_commune.csv      ← résultat de l'agrégation (séparateur « ; »)
└── captures/                     ← captures d'écran de Navicat
```

## Le dataset

- **Fichier source** : `velib-disponibilite-en-temps-reel.json` (open data Vélib' Métropole)
- **Base / collection** : `Velib.stations`
- **Champs utilisés** :
  - `nom_arrondissement_communes` — commune de la station
  - `capacity` — nombre total de bornettes
  - `numbikesavailable` — vélos disponibles
  - `ebike` — vélos électriques disponibles
  - `is_renting` — station en service (`OUI` / `NON`)

## Étapes du TP

### 1. Import des données
- Création de la connexion MongoDB et de la base `Velib` dans Navicat.
- Import du fichier JSON avec l'**Import Wizard**.
- Renommage de la collection (qui portait le nom du fichier) en `stations`.

Le script complet des requêtes dans l'éditeur de Navicat (base `Velib`, collection `stations`) :

![Script des requêtes dans Navicat](captures/01_script_requetes.jpg)

### 2. Nettoyage
Suppression des stations hors service ou sans capacité :

```js
// Vérification
db.stations.find({ $or: [ { is_renting: "NON" }, { capacity: 0 } ] })

// Suppression
db.stations.deleteMany({ $or: [ { is_renting: "NON" }, { capacity: 0 } ] })
```

➡️ **67 stations supprimées**, il en reste **1 452**.

Vérification avant suppression (`find`) :

![Vérification des stations à supprimer](captures/02_verification_find.jpg)

Exécution de la suppression (`deleteMany`) :

![Exécution du deleteMany](captures/03_suppression_deleteMany.jpg)

> Sur la capture ci-dessous, `deletedCount` vaut **0** : la requête a été relancée alors que les 67 stations avaient déjà été supprimées. Cela confirme que la collection est bien nettoyée.

![Résultat du deleteMany](captures/04_resultat_deleteMany.jpg)

### 3. Agrégation par commune
Nombre de stations, de vélos disponibles et de vélos électriques par commune, triés par nombre de vélos décroissant :

```js
db.stations.aggregate([
  { $group: {
      _id: "$nom_arrondissement_communes",
      nb_stations: { $sum: 1 },
      velos_dispo: { $sum: "$numbikesavailable" },
      velos_electriques: { $sum: "$ebike" }
  }},
  { $sort: { velos_dispo: -1 } }
])
```

Résultat dans Navicat (69 communes) :

![Résultat de l'agrégation par commune](captures/05_agregation_par_commune.jpg)

Le résultat a été exporté dans [`resultat_par_commune.csv`](resultat_par_commune.csv).

## Exécution

Dans Navicat : *Nouvelle requête* sur la base `Velib`, coller le contenu de `requetes_mongodb.js`, **sélectionner la requête entière** puis exécuter.

En ligne de commande :

```bash
mongosh "mongodb://localhost:27017/Velib" requetes_mongodb.js
```

## Principaux résultats

**69 communes**, 1 452 stations et 17 709 vélos disponibles au moment de l'extraction (dont 6 636 électriques, soit ≈ 37 %).

| Commune | Stations | Vélos disponibles | dont électriques |
|---|---:|---:|---:|
| Paris | 935 | 11 733 | 3 890 |
| Boulogne-Billancourt | 29 | 568 | 108 |
| Ivry-sur-Seine | 18 | 366 | 94 |
| Issy-les-Moulineaux | 22 | 326 | 78 |
| Vitry-sur-Seine | 17 | 282 | 111 |

- **Paris** concentre 64 % des stations et 66 % des vélos disponibles.
- Certaines communes ont une forte part de vélos électriques : **Pantin** (132 sur 191), **Saint-Ouen-sur-Seine** (110 sur 210).

> Les données étant en temps réel, les chiffres varient selon le moment de l'import.

## Difficultés rencontrées

1. **Nom de collection** : la collection portait le nom du fichier (avec des tirets), donc `db.stations` ne renvoyait rien. → Renommage de la collection en `stations`.
2. **`SyntaxError: expected expression, got end of script`** : seule une partie de l'agrégation était sélectionnée à l'exécution. → Sélectionner la requête complète avant de la lancer.

## Auteur

Mamadou Sidy Barry
