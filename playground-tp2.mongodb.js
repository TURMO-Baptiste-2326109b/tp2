// ============================================================================
// TP2 : Requêtage avancé et pipeline d'agrégation MongoDB
// Fichier d'exercices interactif - BUT3 Informatique
// ============================================================================
//
// Instructions :
// 1. Ouvrir ce fichier dans VS Code avec l'extension MongoDB for VS Code
// 2. Connectez-vous à votre cluster Atlas
// 3. Exécutez les blocs de code avec Ctrl+Alt+R (ou clic droit > Run)
// 4. Complétez les exercices dans les zones "// TODO"
//
// ============================================================================

// ----------------------------------------------------------------------------
// CONFIGURATION INITIALE
// ----------------------------------------------------------------------------

// Sélectionner la base de données sample_restaurants
use("sample_restaurants");

// Vérifier que les données sont bien chargées
db.restaurants.countDocuments();
// Résultat attendu : ~25359 documents

// Voir la structure d'un document
db.restaurants.findOne();

// Vérifier la collection neighborhoods
db.neighborhoods.countDocuments();
// Résultat attendu : ~195 documents


// ############################################################################
// PHASE 1 : REQUÊTES AVANCÉES AVEC FIND()
// ############################################################################

// ============================================================================
// Exercice 1 : $elemMatch simple
// ============================================================================
// Objectif : Trouver les restaurants qui ont reçu un grade "B" avec un
//            score inférieur à 10 dans la MÊME inspection
// Difficulté : ⭐☆☆ (1/3)
//
// Rappel : Sans $elemMatch, MongoDB cherche les conditions indépendamment
//          dans le tableau. Avec $elemMatch, TOUTES les conditions doivent
//          être satisfaites par le MÊME élément.
//
// Résultat attendu : ~2800 documents
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ============================================================================
// Exercice 2 : $elemMatch avec plage de dates
// ============================================================================
// Objectif : Trouver les restaurants qui ont eu une inspection en 2014
//            avec un grade "A"
// Difficulté : ⭐⭐☆ (2/3)
//
// Indice : Pour filtrer l'année 2014, utilisez une plage de dates :
//          $gte: ISODate("2014-01-01") et $lt: ISODate("2015-01-01")
//
// Résultat attendu : ~18000 documents
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ============================================================================
// Exercice 3 : $elemMatch avec $or
// ============================================================================
// Objectif : Trouver les restaurants avec au moins une MAUVAISE inspection
//            (grade "C" OU score supérieur à 30)
// Difficulté : ⭐⭐☆ (2/3)
//
// Indice : Combinez $elemMatch avec $or à l'intérieur
//
// Résultat attendu : ~4500 documents
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ============================================================================
// Exercice 4 : $expr avec $size
// ============================================================================
// Objectif : Trouver les restaurants qui ont exactement 4 inspections
// Difficulté : ⭐⭐☆ (2/3)
//
// Rappel : $expr permet d'utiliser des expressions d'agrégation dans find()
//          $size retourne la taille d'un tableau
//          $eq: [valeur1, valeur2] teste l'égalité
//
// Résultat attendu : ~3500 documents
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ============================================================================
// Exercice 5 : Comparer des éléments du tableau
// ============================================================================
// Objectif : Trouver les restaurants qui se sont AMÉLIORÉS :
//            le score de la dernière inspection est meilleur (plus bas)
//            que celui de la première
// Difficulté : ⭐⭐⭐ (3/3)
//
// Indice :
//   - $arrayElemAt: ["$grades.score", 0]  → premier élément
//   - $arrayElemAt: ["$grades.score", -1] → dernier élément
//   - Un score plus bas est meilleur, donc utilisez $lt
//
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ============================================================================
// Exercice 6 : Validation de données
// ============================================================================
// Objectif : Trouver tous les restaurants où le champ "borough" est
//            manquant ou vide (chaîne vide "")
// Difficulté : ⭐☆☆ (1/3)
//
// Indice : Utilisez $or avec $exists: false et borough: ""
//
// ============================================================================

// TODO : Compléter la requête
db.restaurants.find({

});


// ############################################################################
// PHASE 2 : INTRODUCTION AU PIPELINE D'AGRÉGATION
// ############################################################################

// ============================================================================
// Exercice 7 : Pipeline simple - Comptage par quartier
// ============================================================================
// Objectif : Afficher le nombre de restaurants par quartier,
//            trié du plus grand au plus petit
// Difficulté : ⭐☆☆ (1/3)
//
// Étapes :
//   1. $group par borough avec $sum: 1 pour compter
//   2. $sort par count décroissant (-1)
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ============================================================================
// Exercice 8 : Pipeline avec filtre - Top cuisines à Manhattan
// ============================================================================
// Objectif : Afficher le top 5 des types de cuisine à Manhattan
// Difficulté : ⭐⭐☆ (2/3)
//
// Étapes :
//   1. $match pour filtrer Manhattan
//   2. $group par cuisine
//   3. $sort décroissant
//   4. $limit à 5
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ============================================================================
// Exercice 9 : Groupement avec $addToSet
// ============================================================================
// Objectif : Pour chaque quartier, afficher le nombre de types de
//            cuisine DIFFÉRENTS
// Difficulté : ⭐⭐⭐ (3/3)
//
// Indice : Utilisez $addToSet pour collecter les cuisines uniques,
//          puis $size dans un $project pour compter
//
// Structure attendue :
// { quartier: "Manhattan", nb_cuisines: 75 }
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ############################################################################
// PHASE 3 : TRANSFORMATION DES DONNÉES
// ############################################################################

// ============================================================================
// Exercice 10 : $unwind + $group - Score moyen par année
// ============================================================================
// Objectif : Calculer le score moyen par année pour toutes les inspections
// Difficulté : ⭐⭐⭐ (3/3)
//
// Étapes :
//   1. $unwind sur grades (dérouler le tableau)
//   2. $group par année (utiliser $year sur grades.date)
//   3. Calculer $avg sur grades.score
//   4. $sort par année
//
// Structure attendue :
// { _id: 2012, avg_score: 10.8, count: 15234 }
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ============================================================================
// Exercice 11 : Analyse par quartier - Inspections
// ============================================================================
// Objectif : Pour chaque quartier, calculer :
//            - Le nombre TOTAL d'inspections (pas de restaurants!)
//            - Le score moyen de toutes les inspections
// Difficulté : ⭐⭐⭐ (3/3)
//
// Attention : Il faut d'abord $unwind les grades pour avoir une ligne
//             par inspection, puis grouper par borough
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ############################################################################
// PHASE 4 : AGRÉGATIONS AVANCÉES
// ############################################################################

// Préparation : Créer la collection des quartiers (exécuter une fois)
db.boroughs.drop();
db.boroughs.insertMany([
    { _id: "Manhattan", population: 1628706, area_km2: 59.1 },
    { _id: "Brooklyn", population: 2559903, area_km2: 183.4 },
    { _id: "Queens", population: 2253858, area_km2: 283.0 },
    { _id: "Bronx", population: 1418207, area_km2: 110.0 },
    { _id: "Staten Island", population: 476143, area_km2: 151.1 }
]);

// Vérification
db.boroughs.find();


// ============================================================================
// Exercice 12 : Jointure avec $lookup
// ============================================================================
// Objectif : Créer un rapport montrant pour chaque quartier :
//            - Le nombre de restaurants
//            - La population du quartier
//            - La densité (nb_restaurants / population * 10000)
// Difficulté : ⭐⭐⭐ (3/3)
//
// Étapes :
//   1. $group par borough pour compter les restaurants
//   2. $lookup vers la collection boroughs
//   3. $unwind le résultat de la jointure
//   4. $project pour calculer la densité avec $divide
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ============================================================================
// Exercice 13 : Histogramme avec $bucket
// ============================================================================
// Objectif : Créer un histogramme du nombre de restaurants par nombre
//            d'inspections : 0, 1-2, 3-4, 5-6, 7+
// Difficulté : ⭐⭐⭐ (3/3)
//
// Étapes :
//   1. $addFields pour calculer le nombre d'inspections ($size)
//   2. $bucket avec boundaries: [0, 1, 3, 5, 7, 20]
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([

]);


// ============================================================================
// Exercice 14 : Dashboard avec $facet
// ============================================================================
// Objectif : Créer un $facet qui produit en une seule requête :
//            1. Le nombre de restaurants par quartier
//            2. La distribution des grades (A, B, C, etc.)
//            3. Le top 3 des cuisines à Manhattan
// Difficulté : ⭐⭐⭐ (3/3)
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([
    { $facet: {
        // Pipeline 1 : Restaurants par quartier
        par_quartier: [
            // TODO
        ],

        // Pipeline 2 : Distribution des grades
        distribution_grades: [
            // TODO
        ],

        // Pipeline 3 : Top 3 cuisines à Manhattan
        top_manhattan: [
            // TODO
        ]
    }}
]);


// ############################################################################
// PHASE 5 : INDEX ET OPTIMISATION
// ############################################################################

// ============================================================================
// Exercice 15 : Optimisation de requête
// ============================================================================
// Objectif : Optimiser cette requête avec les index appropriés
// Difficulté : ⭐⭐⭐ (3/3)
//
// Requête à optimiser :
// db.restaurants.find({
//     borough: "Brooklyn",
//     cuisine: "Italian"
// }).sort({ name: 1 })
// ============================================================================

// Étape 1 : Mesurer AVANT optimisation
// Noter : totalDocsExamined, executionTimeMillis, stage
db.restaurants.find({
    borough: "Brooklyn",
    cuisine: "Italian"
}).sort({ name: 1 }).explain("executionStats");

// Étape 2 : Créer l'index optimal
// TODO : Quel index créer ?
// db.restaurants.createIndex({ ... })


// Étape 3 : Mesurer APRÈS optimisation
db.restaurants.find({
    borough: "Brooklyn",
    cuisine: "Italian"
}).sort({ name: 1 }).explain("executionStats");

// Voir tous les index
db.restaurants.getIndexes();


// ============================================================================
// Exercice 16 : Recherche géospatiale
// ============================================================================
// Objectif : Trouver les 5 restaurants italiens les plus proches de
//            Central Park (coordonnées : [-73.965355, 40.782865])
// Difficulté : ⭐⭐⭐ (3/3)
//
// Étapes :
//   1. Créer l'index géospatial sur address.coord
//   2. Utiliser $nearSphere avec $geometry
//   3. Filtrer par cuisine: "Italian"
//   4. Limiter à 5 résultats
// ============================================================================

// Étape 1 : Créer l'index géospatial
db.restaurants.createIndex({ "address.coord": "2dsphere" });

// TODO : Compléter la requête
db.restaurants.find({

}).limit(5);


// ############################################################################
// PHASE 6 : MINI-PROJET DASHBOARD
// ############################################################################

// ============================================================================
// Challenge : Dashboard analytique complet
// ============================================================================
// Objectif : Créer UNE SEULE requête d'agrégation avec $facet qui produit
//            toutes les métriques pour un tableau de bord
// Difficulté : ⭐⭐⭐ (3/3) - Challenge avancé
//
// Le dashboard doit contenir :
//
// 1. Vue d'ensemble (overview)
//    - Nombre total de restaurants
//    - Nombre de types de cuisine différents
//
// 2. Top 5 des quartiers (top_quartiers)
//    - Par nombre de restaurants
//    - Avec le score moyen des inspections
//
// 3. Distribution des grades (distribution_grades)
//    - Nombre d'inspections par grade (A, B, C, etc.)
//
// 4. Evolution annuelle (evolution_annuelle)
//    - Score moyen par année (2012-2014)
//
// ============================================================================

// TODO : Compléter le pipeline
db.restaurants.aggregate([
    { $facet: {
        // Vue d'ensemble
        overview: [
            // TODO
        ],

        // Top quartiers
        top_quartiers: [
            // TODO
        ],

        // Distribution des grades
        distribution_grades: [
            // TODO
        ],

        // Evolution annuelle
        evolution_annuelle: [
            // TODO
        ]
    }}
]);


// ============================================================================
// CHECKLIST DE VALIDATION
// ============================================================================
//
// Phase 1 - Requêtes avancées :
// [ ] Exercice 1 : $elemMatch simple
// [ ] Exercice 2 : $elemMatch avec dates
// [ ] Exercice 3 : $elemMatch avec $or
// [ ] Exercice 4 : $expr avec $size
// [ ] Exercice 5 : Comparaison d'éléments
// [ ] Exercice 6 : Validation de données
//
// Phase 2 - Pipeline d'agrégation :
// [ ] Exercice 7 : Comptage par quartier
// [ ] Exercice 8 : Top cuisines Manhattan
// [ ] Exercice 9 : Cuisines par quartier
//
// Phase 3 - Transformation :
// [ ] Exercice 10 : Score moyen par année
// [ ] Exercice 11 : Inspections par quartier
//
// Phase 4 - Agrégations avancées :
// [ ] Exercice 12 : Jointure $lookup
// [ ] Exercice 13 : Histogramme $bucket
// [ ] Exercice 14 : Dashboard $facet
//
// Phase 5 - Optimisation :
// [ ] Exercice 15 : Index composé
// [ ] Exercice 16 : Index géospatial
//
// Phase 6 - Mini-projet :
// [ ] Challenge Dashboard complet
//
// ============================================================================


// ============================================================================
// FIN DU TP2 - Prochain TP : Modélisation avancée MongoDB
// ============================================================================
