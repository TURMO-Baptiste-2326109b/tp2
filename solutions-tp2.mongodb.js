// ============================================================================
// TP2 : SOLUTIONS DÉTAILLÉES
// Requêtage avancé et pipeline d'agrégation MongoDB
// BUT3 Informatique - R5.Real.10
// ============================================================================
//
// ATTENTION : Ce fichier contient les solutions complètes.
// Essayez d'abord de résoudre les exercices dans playground-tp2.mongodb.js
//
// ============================================================================

use("sample_restaurants");


// ############################################################################
// PHASE 1 : REQUÊTES AVANCÉES AVEC FIND()
// ############################################################################

// ============================================================================
// EXERCICE 1 : $elemMatch simple
// ============================================================================
// Objectif : Restaurants avec grade "B" ET score < 10 dans la MÊME inspection
//
// EXPLICATION :
// Sans $elemMatch, les conditions sont évaluées indépendamment :
//   "grades.grade": "B"      → cherche un "B" quelque part
//   "grades.score": {$lt:10} → cherche un score < 10 quelque part
//   → Ces deux conditions peuvent être satisfaites par des éléments DIFFÉRENTS
//
// Avec $elemMatch, un SEUL élément doit satisfaire TOUTES les conditions
// ============================================================================

// SOLUTION :
db.restaurants.find({
    grades: {
        $elemMatch: {
            grade: "B",
            score: { $lt: 10 }
        }
    }
});

// Vérification du nombre de résultats
db.restaurants.countDocuments({
    grades: { $elemMatch: { grade: "B", score: { $lt: 10 } } }
});
// Résultat attendu : ~2800 documents


// ============================================================================
// EXERCICE 2 : $elemMatch avec plage de dates
// ============================================================================
// Objectif : Restaurants inspectés en 2014 avec grade "A"
//
// EXPLICATION :
// Les dates MongoDB sont des objets ISODate. Pour filtrer une année,
// on définit une plage : du 1er janvier 2014 au 1er janvier 2015 (exclu)
// ============================================================================

// SOLUTION :
db.restaurants.find({
    grades: {
        $elemMatch: {
            grade: "A",
            date: {
                $gte: ISODate("2014-01-01T00:00:00Z"),
                $lt: ISODate("2015-01-01T00:00:00Z")
            }
        }
    }
});

// Vérification
db.restaurants.countDocuments({
    grades: {
        $elemMatch: {
            grade: "A",
            date: { $gte: ISODate("2014-01-01"), $lt: ISODate("2015-01-01") }
        }
    }
});
// Résultat attendu : ~18000 documents


// ============================================================================
// EXERCICE 3 : $elemMatch avec $or
// ============================================================================
// Objectif : Restaurants avec au moins une mauvaise inspection
//            (grade "C" OU score > 30)
//
// EXPLICATION :
// On utilise $or à l'INTÉRIEUR de $elemMatch pour que les conditions
// alternatives s'appliquent au même élément du tableau
// ============================================================================

// SOLUTION :
db.restaurants.find({
    grades: {
        $elemMatch: {
            $or: [
                { grade: "C" },
                { score: { $gt: 30 } }
            ]
        }
    }
});

// Vérification
db.restaurants.countDocuments({
    grades: { $elemMatch: { $or: [{ grade: "C" }, { score: { $gt: 30 } }] } }
});
// Résultat attendu : ~4500 documents


// ============================================================================
// EXERCICE 4 : $expr avec $size
// ============================================================================
// Objectif : Restaurants avec exactement 4 inspections
//
// EXPLICATION :
// $expr permet d'utiliser des opérateurs d'agrégation dans find()
// $size retourne la taille d'un tableau
// $eq compare deux valeurs pour l'égalité
// ============================================================================

// SOLUTION :
db.restaurants.find({
    $expr: {
        $eq: [{ $size: "$grades" }, 4]
    }
});

// Vérification
db.restaurants.countDocuments({
    $expr: { $eq: [{ $size: "$grades" }, 4] }
});
// Résultat attendu : ~3500 documents

// ALTERNATIVE avec $size dans la requête (exactement N éléments) :
db.restaurants.countDocuments({ grades: { $size: 4 } });
// Note : Cette syntaxe ne fonctionne que pour l'égalité exacte


// ============================================================================
// EXERCICE 5 : Comparer des éléments du tableau
// ============================================================================
// Objectif : Restaurants améliorés (dernier score < premier score)
//
// EXPLICATION :
// $arrayElemAt extrait un élément à un index donné :
//   - Index 0 = premier élément
//   - Index -1 = dernier élément
// Un score plus bas est meilleur, donc on cherche où dernier < premier
// ============================================================================

// SOLUTION :
db.restaurants.find({
    $expr: {
        $lt: [
            { $arrayElemAt: ["$grades.score", -1] },  // Dernier score
            { $arrayElemAt: ["$grades.score", 0] }    // Premier score
        ]
    }
});

// Note : Cette requête peut retourner des résultats inattendus si grades est vide
// Version robuste :
db.restaurants.find({
    $expr: {
        $and: [
            { $gt: [{ $size: "$grades" }, 1] },  // Au moins 2 inspections
            { $lt: [
                { $arrayElemAt: ["$grades.score", -1] },
                { $arrayElemAt: ["$grades.score", 0] }
            ]}
        ]
    }
});


// ============================================================================
// EXERCICE 6 : Validation de données
// ============================================================================
// Objectif : Restaurants où borough est manquant ou vide
//
// EXPLICATION :
// $exists: false vérifie que le champ n'existe pas
// borough: "" vérifie que le champ existe mais est une chaîne vide
// ============================================================================

// SOLUTION :
db.restaurants.find({
    $or: [
        { borough: { $exists: false } },
        { borough: "" }
    ]
});

// Version plus complète incluant null :
db.restaurants.find({
    $or: [
        { borough: { $exists: false } },
        { borough: null },
        { borough: "" }
    ]
});


// ############################################################################
// PHASE 2 : INTRODUCTION AU PIPELINE D'AGRÉGATION
// ############################################################################

// ============================================================================
// EXERCICE 7 : Pipeline simple - Comptage par quartier
// ============================================================================
// Objectif : Nombre de restaurants par quartier, trié décroissant
//
// EXPLICATION :
// $group avec _id définit le champ de regroupement
// $sum: 1 compte le nombre de documents dans chaque groupe
// $sort: {count: -1} trie par count décroissant
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    {
        $group: {
            _id: "$borough",
            count: { $sum: 1 }
        }
    },
    {
        $sort: { count: -1 }
    }
]);

// Résultat attendu :
// Manhattan: ~10259, Brooklyn: ~6086, Queens: ~5656, Bronx: ~2338, Staten Island: ~969


// ============================================================================
// EXERCICE 8 : Pipeline avec filtre - Top cuisines à Manhattan
// ============================================================================
// Objectif : Top 5 des cuisines à Manhattan
//
// EXPLICATION :
// L'ordre des étapes est important :
// 1. $match d'abord pour réduire les données (performance)
// 2. $group pour compter par cuisine
// 3. $sort pour ordonner
// 4. $limit pour garder les 5 premiers
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    { $match: { borough: "Manhattan" } },
    { $group: {
        _id: "$cuisine",
        count: { $sum: 1 }
    }},
    { $sort: { count: -1 } },
    { $limit: 5 }
]);

// Résultat attendu :
// American: ~3205, Café/Coffee/Tea: ~1039, Italian: ~932, Chinese: ~826, Japanese: ~517


// ============================================================================
// EXERCICE 9 : Groupement avec $addToSet
// ============================================================================
// Objectif : Nombre de cuisines différentes par quartier
//
// EXPLICATION :
// $addToSet collecte les valeurs UNIQUES (comme un Set)
// $size dans $project compte le nombre d'éléments
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    {
        $group: {
            _id: "$borough",
            cuisines: { $addToSet: "$cuisine" }
        }
    },
    {
        $project: {
            _id: 0,
            quartier: "$_id",
            nb_cuisines: { $size: "$cuisines" }
        }
    },
    {
        $sort: { nb_cuisines: -1 }
    }
]);

// Résultat attendu :
// Manhattan: ~75, Brooklyn: ~70, Queens: ~70, Bronx: ~53, Staten Island: ~45


// ############################################################################
// PHASE 3 : TRANSFORMATION DES DONNÉES
// ############################################################################

// ============================================================================
// EXERCICE 10 : $unwind + $group - Score moyen par année
// ============================================================================
// Objectif : Score moyen par année pour toutes les inspections
//
// EXPLICATION :
// $unwind transforme : {grades: [{...}, {...}]} → 2 documents séparés
// $year extrait l'année d'une date
// $avg calcule la moyenne
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    { $unwind: "$grades" },
    {
        $group: {
            _id: { $year: "$grades.date" },
            avg_score: { $avg: "$grades.score" },
            count: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } }
]);

// Résultat attendu (approximatif) :
// 2011: avg_score ~9.8
// 2012: avg_score ~10.5
// 2013: avg_score ~11.2
// 2014: avg_score ~11.8


// ============================================================================
// EXERCICE 11 : Analyse par quartier - Inspections
// ============================================================================
// Objectif : Nombre total d'inspections et score moyen par quartier
//
// EXPLICATION :
// Attention : on compte les INSPECTIONS, pas les restaurants
// Il faut d'abord $unwind pour avoir une ligne par inspection
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    { $unwind: "$grades" },
    {
        $group: {
            _id: "$borough",
            nb_inspections: { $sum: 1 },
            score_moyen: { $avg: "$grades.score" }
        }
    },
    {
        $project: {
            _id: 0,
            quartier: "$_id",
            nb_inspections: 1,
            score_moyen: { $round: ["$score_moyen", 1] }
        }
    },
    { $sort: { nb_inspections: -1 } }
]);

// Résultat attendu :
// Manhattan: ~50000 inspections, Brooklyn: ~29000, Queens: ~27000...


// ############################################################################
// PHASE 4 : AGRÉGATIONS AVANCÉES
// ############################################################################

// ============================================================================
// EXERCICE 12 : Jointure avec $lookup
// ============================================================================
// Objectif : Rapport par quartier avec population et densité
//
// EXPLICATION :
// $lookup fait une jointure LEFT OUTER JOIN
// Le résultat est TOUJOURS un tableau (même avec un seul match)
// $unwind transforme ce tableau en objet
// $divide calcule la division pour la densité
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    // 1. Compter les restaurants par quartier
    {
        $group: {
            _id: "$borough",
            nb_restaurants: { $sum: 1 }
        }
    },
    // 2. Joindre avec boroughs
    {
        $lookup: {
            from: "boroughs",
            localField: "_id",
            foreignField: "_id",
            as: "borough_info"
        }
    },
    // 3. Dérouler le résultat de la jointure
    { $unwind: "$borough_info" },
    // 4. Calculer la densité
    {
        $project: {
            _id: 0,
            quartier: "$_id",
            nb_restaurants: 1,
            population: "$borough_info.population",
            densite_pour_10000: {
                $round: [
                    { $multiply: [
                        { $divide: ["$nb_restaurants", "$borough_info.population"] },
                        10000
                    ]},
                    1
                ]
            }
        }
    },
    { $sort: { densite_pour_10000: -1 } }
]);

// Résultat attendu :
// Manhattan: densité ~63, Staten Island: ~20, Brooklyn: ~24...


// ============================================================================
// EXERCICE 13 : Histogramme avec $bucket
// ============================================================================
// Objectif : Distribution des restaurants par nombre d'inspections
//
// EXPLICATION :
// $addFields ajoute un champ calculé sans modifier les autres
// $bucket regroupe en tranches définies par boundaries
// boundaries [0, 1, 3, 5, 7, 20] crée les tranches: 0, 1-2, 3-4, 5-6, 7-19
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    // 1. Calculer le nombre d'inspections par restaurant
    {
        $addFields: {
            nb_inspections: { $size: "$grades" }
        }
    },
    // 2. Créer l'histogramme
    {
        $bucket: {
            groupBy: "$nb_inspections",
            boundaries: [0, 1, 3, 5, 7, 20],
            default: "20+",
            output: {
                count: { $sum: 1 }
            }
        }
    }
]);

// Version avec labels descriptifs :
db.restaurants.aggregate([
    { $addFields: { nb_inspections: { $size: "$grades" } } },
    { $bucket: {
        groupBy: "$nb_inspections",
        boundaries: [0, 1, 3, 5, 7, 20],
        default: "20+",
        output: { count: { $sum: 1 } }
    }},
    { $project: {
        tranche: {
            $switch: {
                branches: [
                    { case: { $eq: ["$_id", 0] }, then: "0 inspection" },
                    { case: { $eq: ["$_id", 1] }, then: "1-2 inspections" },
                    { case: { $eq: ["$_id", 3] }, then: "3-4 inspections" },
                    { case: { $eq: ["$_id", 5] }, then: "5-6 inspections" },
                    { case: { $eq: ["$_id", 7] }, then: "7+ inspections" }
                ],
                default: "Autres"
            }
        },
        count: 1,
        _id: 0
    }}
]);


// ============================================================================
// EXERCICE 14 : Dashboard avec $facet
// ============================================================================
// Objectif : Trois analyses en une seule requête
//
// EXPLICATION :
// $facet exécute plusieurs pipelines en parallèle
// Chaque pipeline est indépendant et reçoit les mêmes documents d'entrée
// ============================================================================

// SOLUTION :
db.restaurants.aggregate([
    {
        $facet: {
            // Pipeline 1 : Restaurants par quartier
            par_quartier: [
                { $group: { _id: "$borough", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ],

            // Pipeline 2 : Distribution des grades
            distribution_grades: [
                { $unwind: "$grades" },
                { $group: { _id: "$grades.grade", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ],

            // Pipeline 3 : Top 3 cuisines à Manhattan
            top_manhattan: [
                { $match: { borough: "Manhattan" } },
                { $group: { _id: "$cuisine", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 3 }
            ]
        }
    }
]);


// ############################################################################
// PHASE 5 : INDEX ET OPTIMISATION
// ############################################################################

// ============================================================================
// EXERCICE 15 : Optimisation de requête
// ============================================================================
// Requête à optimiser :
// db.restaurants.find({borough: "Brooklyn", cuisine: "Italian"}).sort({name: 1})
//
// EXPLICATION :
// L'index optimal doit couvrir :
// 1. Les champs de filtre (borough, cuisine) - pour éviter le COLLSCAN
// 2. Le champ de tri (name) - pour éviter le tri en mémoire
//
// Ordre recommandé : champs d'égalité d'abord, puis tri
// ============================================================================

// SOLUTION :
db.restaurants.createIndex({ borough: 1, cuisine: 1, name: 1 });

// Vérifier l'amélioration :
db.restaurants.find({
    borough: "Brooklyn",
    cuisine: "Italian"
}).sort({ name: 1 }).explain("executionStats");

// AVANT : stage = COLLSCAN, totalDocsExamined = ~25359
// APRÈS : stage = IXSCAN, totalDocsExamined = ~287 (seulement les restaurants concernés)


// ============================================================================
// EXERCICE 16 : Recherche géospatiale
// ============================================================================
// Objectif : 5 restaurants italiens les plus proches de Central Park
//
// EXPLICATION :
// Les requêtes géospatiales nécessitent un index 2dsphere
// $nearSphere trouve les documents proches d'un point, triés par distance
// Le format est [longitude, latitude] (attention à l'ordre!)
// ============================================================================

// Créer l'index géospatial
db.restaurants.createIndex({ "address.coord": "2dsphere" });

// SOLUTION :
db.restaurants.find({
    cuisine: "Italian",
    "address.coord": {
        $nearSphere: {
            $geometry: {
                type: "Point",
                coordinates: [-73.965355, 40.782865]  // Central Park [lng, lat]
            }
        }
    }
}).limit(5);

// Version avec distance maximale (1km) :
db.restaurants.find({
    cuisine: "Italian",
    "address.coord": {
        $nearSphere: {
            $geometry: {
                type: "Point",
                coordinates: [-73.965355, 40.782865]
            },
            $maxDistance: 1000  // en mètres
        }
    }
}).limit(5);


// ############################################################################
// PHASE 6 : MINI-PROJET DASHBOARD
// ############################################################################

// ============================================================================
// CHALLENGE : Dashboard analytique complet
// ============================================================================

// SOLUTION COMPLÈTE :
db.restaurants.aggregate([
    {
        $facet: {
            // ============================================
            // Vue d'ensemble
            // ============================================
            overview: [
                {
                    $group: {
                        _id: null,
                        total_restaurants: { $sum: 1 },
                        cuisines: { $addToSet: "$cuisine" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total_restaurants: 1,
                        total_cuisines: { $size: "$cuisines" }
                    }
                }
            ],

            // ============================================
            // Top 5 des quartiers
            // ============================================
            top_quartiers: [
                { $unwind: "$grades" },
                {
                    $group: {
                        _id: "$borough",
                        nb_restaurants: { $addToSet: "$_id" },
                        score_moyen: { $avg: "$grades.score" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        quartier: "$_id",
                        nb_restaurants: { $size: "$nb_restaurants" },
                        score_moyen: { $round: ["$score_moyen", 1] }
                    }
                },
                { $sort: { nb_restaurants: -1 } },
                { $limit: 5 }
            ],

            // ============================================
            // Distribution des grades
            // ============================================
            distribution_grades: [
                { $unwind: "$grades" },
                {
                    $group: {
                        _id: "$grades.grade",
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        grade: "$_id",
                        count: 1
                    }
                },
                { $sort: { grade: 1 } }
            ],

            // ============================================
            // Evolution annuelle
            // ============================================
            evolution_annuelle: [
                { $unwind: "$grades" },
                {
                    $group: {
                        _id: { $year: "$grades.date" },
                        score_moyen: { $avg: "$grades.score" },
                        nb_inspections: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        _id: { $gte: 2012, $lte: 2014 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        annee: "$_id",
                        score_moyen: { $round: ["$score_moyen", 1] },
                        nb_inspections: 1
                    }
                },
                { $sort: { annee: 1 } }
            ]
        }
    }
]);

// STRUCTURE DU RÉSULTAT :
// {
//   "overview": [{
//     "total_restaurants": 25359,
//     "total_cuisines": 85
//   }],
//   "top_quartiers": [
//     { "quartier": "Manhattan", "nb_restaurants": 10259, "score_moyen": 11.4 },
//     { "quartier": "Brooklyn", "nb_restaurants": 6086, "score_moyen": 11.8 },
//     ...
//   ],
//   "distribution_grades": [
//     { "grade": "A", "count": 80234 },
//     { "grade": "B", "count": 15678 },
//     { "grade": "C", "count": 4567 },
//     ...
//   ],
//   "evolution_annuelle": [
//     { "annee": 2012, "score_moyen": 10.5, "nb_inspections": 25432 },
//     { "annee": 2013, "score_moyen": 11.2, "nb_inspections": 28976 },
//     { "annee": 2014, "score_moyen": 11.8, "nb_inspections": 31245 }
//   ]
// }


// ============================================================================
// FIN DES SOLUTIONS
// ============================================================================
