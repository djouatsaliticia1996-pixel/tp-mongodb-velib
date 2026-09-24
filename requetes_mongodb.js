// TP MongoDB dans Navicat Premium - Données Vélib' en temps réel
// Base : Velib    Collection : stations

// Étape 2 - Nettoyage
// 2a. Regarder les stations hors service ou sans capacité
db.stations.find({ $or: [ { is_renting: "NON" }, { capacity: 0 } ] })

// 2b. Les supprimer
db.stations.deleteMany({ $or: [ { is_renting: "NON" }, { capacity: 0 } ] })

// Étape 3 - Résumé par commune
db.stations.aggregate([
  { $group: {
      _id: "$nom_arrondissement_communes",
      nb_stations: { $sum: 1 },
      velos_dispo: { $sum: "$numbikesavailable" },
      velos_electriques: { $sum: "$ebike" }
  }},
  { $sort: { velos_dispo: -1 } }
])
