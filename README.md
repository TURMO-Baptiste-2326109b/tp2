# TP2 : Requêtage avancé et pipeline d'agrégation MongoDB (4h)

## Objectifs de la séance

### Objectifs pédagogiques
À l'issue de cette séance, vous serez capable de :
- **Maîtriser** les opérateurs avancés de requêtage (`$elemMatch`, `$expr`)
- **Construire** des pipelines d'agrégation pour l'analyse de données
- **Transformer** les données avec `$project`, `$unwind`, `$addFields`
- **Réaliser** des jointures et agrégations avancées (`$lookup`, `$facet`)
- **Optimiser** les requêtes avec les index appropriés

### Lien avec le projet fil rouge
Les concepts de cette séance sont essentiels pour votre projet final :
- **Agrégation temporelle** : moyennes horaires/journalières des capteurs
- **$lookup** : jointure entre capteurs et mesures
- **Index composés** : optimisation des requêtes temps réel

### Prérequis
- TP1 complété (CRUD, documents imbriqués)
- MongoDB Atlas configuré et accessible

---

## Préparation : Chargement du dataset

Pour cette séance, nous utilisons le dataset **sample_restaurants** fourni par MongoDB Atlas. Il contient des données sur les restaurants et quartiers de New York.

### Charger les Sample Data dans Atlas

MongoDB Atlas propose des datasets d'exemple préchargés. Pour les activer :

1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com)
2. Dans la vue **Clusters**, cliquez sur le bouton **"..."** (ellipsis) de votre cluster
3. Sélectionnez **"Load Sample Dataset"**
4. Attendez quelques minutes que le chargement se termine

> **Alternative :** Lors de la création d'un nouveau cluster, Atlas propose automatiquement de charger les sample data.

Une fois chargé, vous aurez accès à la base **`sample_restaurants`** contenant deux collections :
- **`restaurants`** : ~25 000 restaurants de New York
- **`neighborhoods`** : les quartiers de NYC avec leurs contours géographiques

Documentation officielle : [Sample Restaurants Dataset](https://www.mongodb.com/docs/atlas/sample-data/sample-restaurants/)

### Structure d'un document restaurant

```javascript
{
  "_id": ObjectId("..."),
  "name": "Morris Park Bake Shop",
  "borough": "Bronx",                    // Quartier de NYC
  "cuisine": "Bakery",                   // Type de cuisine
  "address": {
    "building": "1007",
    "street": "Morris Park Ave",
    "zipcode": "10462",
    "coord": [-73.856077, 40.848447]     // [longitude, latitude]
  },
  "grades": [                            // Historique des inspections
    { "date": ISODate("2014-03-03"), "grade": "A", "score": 2 },
    { "date": ISODate("2013-09-11"), "grade": "A", "score": 6 }
  ],
  "restaurant_id": "30075445"
}
```

> **Note :** Le champ `grades` est un tableau d'objets représentant les inspections sanitaires.
> - `grade` : A (excellent), B (bon), C (à améliorer)
> - `score` : plus le score est bas, meilleur est le restaurant

### Vérification du chargement

```javascript
// Sélectionner la base sample_restaurants
use sample_restaurants

// Compter les documents
db.restaurants.countDocuments()  // Attendu : ~25359

// Voir un exemple
db.restaurants.findOne()

// Vérifier la collection neighborhoods
db.neighborhoods.countDocuments()  // Attendu : ~195
```

### Alternative : Téléchargement local

Si vous travaillez en local sans Atlas, vous pouvez récupérer les datasets depuis ce dépôt GitHub :
[mongodb-sample-dataset](https://github.com/neelabalan/mongodb-sample-dataset)

```bash
# Cloner le dépôt
git clone https://github.com/neelabalan/mongodb-sample-dataset.git

# Importer la collection restaurants
mongoimport --db sample_restaurants --collection restaurants \
            --file mongodb-sample-dataset/sample_restaurants/restaurants.json
```

---

## Phase 1 : Requêtes avancées avec find() (45 min)

Cette phase approfondit les capacités de `find()` avant d'aborder l'agrégation.

### 1.1 Rappel : Requêtes sur les tableaux

Avant d'aller plus loin, rappelons comment MongoDB gère les requêtes sur les tableaux.

```javascript
// Trouver les restaurants avec au moins un grade "A"
db.restaurants.find({ "grades.grade": "A" })

// Trouver les restaurants avec un score < 10 dans grades
db.restaurants.find({ "grades.score": { $lt: 10 } })
```

**Problème :** Ces deux conditions sont évaluées **indépendamment** sur le tableau.

```javascript
// Cette requête trouve les restaurants qui ont :
// - AU MOINS UN grade "A" quelque part dans grades
// - ET AU MOINS UN score < 5 quelque part (pas forcément le même élément!)
db.restaurants.find({
    "grades.grade": "A",
    "grades.score": { $lt: 5 }
})
```

### 1.2 L'opérateur $elemMatch

`$elemMatch` garantit que **toutes les conditions** s'appliquent au **même élément** du tableau.

```javascript
// Un MÊME élément de grades doit avoir grade "A" ET score < 5
db.restaurants.find({
    grades: {
        $elemMatch: {
            grade: "A",
            score: { $lt: 5 }
        }
    }
})
```

#### Visualisation de la différence

```
Document : { grades: [{grade:"A", score:10}, {grade:"B", score:3}] }

Requête SANS $elemMatch :
  "grades.grade": "A"     → ✓ (premier élément)
  "grades.score": {$lt:5} → ✓ (deuxième élément)
  Résultat : MATCH ✓ (conditions sur éléments différents)

Requête AVEC $elemMatch :
  grades: {$elemMatch: {grade:"A", score:{$lt:5}}}
  Premier élément : grade="A" ✓, score=10 ✗ → Non
  Deuxième élément : grade="B" ✗ → Non
  Résultat : PAS DE MATCH ✗ (aucun élément ne satisfait les deux)
```

#### Exercice 1 : $elemMatch simple
Trouver les restaurants qui ont reçu un grade "B" avec un score inférieur à 10 **dans la même inspection**.

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

Utilisez `$elemMatch` avec deux conditions : `grade: "B"` et `score: { $lt: 10 }`

</details>

#### Exercice 2 : $elemMatch avec plage de dates
Trouver les restaurants qui ont eu une inspection en 2014 avec un grade "A".

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

Pour filtrer l'année 2014, utilisez une plage de dates :
- `$gte: ISODate("2014-01-01")`
- `$lt: ISODate("2015-01-01")`

</details>

#### Exercice 3 : $elemMatch avec $or
Trouver les restaurants qui ont au moins une **mauvaise** inspection : grade "C" **ou** score supérieur à 30.

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

Combinez `$elemMatch` avec `$or` à l'intérieur :
```javascript
grades: { $elemMatch: { $or: [ {condition1}, {condition2} ] } }
```

</details>

### 1.3 L'opérateur $expr

`$expr` permet d'utiliser des **expressions d'agrégation** dans `find()`, notamment pour :
- Comparer deux champs du même document
- Utiliser des opérateurs comme `$size`, `$arrayElemAt`, etc.

#### Compter les éléments d'un tableau

```javascript
// Restaurants avec plus de 5 inspections
db.restaurants.find({
    $expr: { $gt: [ { $size: "$grades" }, 5 ] }
})
```

**Syntaxe :** `$expr` attend une expression qui retourne `true` ou `false`.
- `$gt: [valeur1, valeur2]` → `valeur1 > valeur2`
- `$size: "$grades"` → nombre d'éléments dans le tableau grades

#### Comparer des champs entre eux

```javascript
// Restaurants où le premier score est meilleur (plus bas) que le dernier
db.restaurants.find({
    $expr: {
        $lt: [
            { $arrayElemAt: ["$grades.score", 0] },   // Premier score
            { $arrayElemAt: ["$grades.score", -1] }   // Dernier score
        ]
    }
})
```

#### Exercice 4 : Utiliser $expr avec $size
Trouver les restaurants qui ont exactement 4 inspections.

```javascript
// Votre réponse :

```

#### Exercice 5 : Comparer des éléments du tableau
Trouver les restaurants dont le restaurant s'est **amélioré** : le score de la dernière inspection est meilleur (plus bas) que celui de la première.

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

- `$arrayElemAt: ["$grades.score", 0]` → premier élément
- `$arrayElemAt: ["$grades.score", -1]` → dernier élément
- Un score plus bas est meilleur, donc utilisez `$lt`

</details>

### 1.4 Opérateurs de type et d'existence

Ces opérateurs sont utiles pour la **validation de données** et la détection d'anomalies.

```javascript
// $exists : vérifier si un champ existe
db.restaurants.find({ "address.zipcode": { $exists: true } })

// $type : vérifier le type d'un champ
db.restaurants.find({ "address.zipcode": { $type: "string" } })

// Types courants : "string", "int", "double", "bool", "array", "object", "date", "null"
```

#### Cas d'usage : Détecter les anomalies de données

```javascript
// Trouver les documents où grades n'est pas un tableau
db.restaurants.find({
    grades: { $not: { $type: "array" } }
})

// Trouver les restaurants sans inspections
db.restaurants.find({
    $or: [
        { grades: { $exists: false } },
        { grades: { $size: 0 } }
    ]
})
```

#### Exercice 6 : Validation de données
Trouver tous les restaurants où le champ `borough` est manquant ou vide.

```javascript
// Votre réponse :

```

### Récapitulatif Phase 1

| Opérateur | Usage | Exemple |
|-----------|-------|---------|
| `$elemMatch` | Conditions multiples sur le même élément d'un tableau | `{grades: {$elemMatch: {grade:"A", score:{$lt:10}}}}` |
| `$expr` | Expressions d'agrégation dans find() | `{$expr: {$gt: [{$size:"$grades"}, 5]}}` |
| `$type` | Vérifier le type d'un champ | `{"field": {$type: "string"}}` |
| `$exists` | Vérifier l'existence d'un champ | `{"field": {$exists: true}}` |

---

## Phase 2 : Introduction au pipeline d'agrégation (50 min)

Le **pipeline d'agrégation** est l'équivalent MongoDB des requêtes analytiques SQL (GROUP BY, HAVING, etc.).

### 2.1 Concept du pipeline

Un pipeline est une **séquence d'étapes** où chaque étape transforme les données :

```
Documents → [$match] → [$group] → [$sort] → [$limit] → Résultat
              ↓           ↓          ↓          ↓
           Filtrer    Regrouper   Trier    Limiter
```

**Principe clé :** La sortie d'une étape devient l'entrée de la suivante.

### 2.2 Syntaxe de base

```javascript
db.collection.aggregate([
    { $etape1: { ... } },
    { $etape2: { ... } },
    { $etape3: { ... } }
])
```

### 2.3 Étape $match : Filtrer les documents

`$match` filtre les documents, comme `find()`. **Placez-le en premier** pour optimiser les performances.

```javascript
// Équivalent de : db.restaurants.find({borough: "Manhattan"})
db.restaurants.aggregate([
    { $match: { borough: "Manhattan" } }
])
```

### 2.4 Étape $group : Regrouper et calculer

`$group` regroupe les documents et calcule des agrégats. C'est l'équivalent de `GROUP BY` en SQL.

```javascript
// Nombre de restaurants par quartier
db.restaurants.aggregate([
    { $group: {
        _id: "$borough",           // GROUP BY borough
        total: { $sum: 1 }         // COUNT(*)
    }}
])
```

**Syntaxe de `$group` :**
- `_id` : le champ de regroupement (obligatoire)
- Autres champs : les agrégats à calculer

#### Accumulateurs disponibles

| Accumulateur | SQL équivalent | Exemple |
|--------------|----------------|---------|
| `$sum: 1` | COUNT(*) | Compter les documents |
| `$sum: "$field"` | SUM(field) | Somme d'un champ |
| `$avg: "$field"` | AVG(field) | Moyenne |
| `$min: "$field"` | MIN(field) | Minimum |
| `$max: "$field"` | MAX(field) | Maximum |
| `$first: "$field"` | - | Premier du groupe |
| `$last: "$field"` | - | Dernier du groupe |
| `$addToSet: "$field"` | - | Valeurs uniques (ensemble) |
| `$push: "$field"` | - | Toutes les valeurs (tableau) |

#### Exemple complet avec plusieurs agrégats

```javascript
// Statistiques par type de cuisine
db.restaurants.aggregate([
    { $group: {
        _id: "$cuisine",
        nb_restaurants: { $sum: 1 },
        quartiers: { $addToSet: "$borough" }  // Liste des quartiers uniques
    }}
])
```

### 2.5 Étapes $sort et $limit

```javascript
// Top 5 des cuisines les plus représentées
db.restaurants.aggregate([
    { $group: {
        _id: "$cuisine",
        count: { $sum: 1 }
    }},
    { $sort: { count: -1 } },    // Tri décroissant
    { $limit: 5 }                 // Garder les 5 premiers
])
```

### 2.6 Comparaison SQL vs MongoDB

| SQL | MongoDB Aggregation |
|-----|---------------------|
| `SELECT cuisine, COUNT(*) as total` | `$group: { _id: "$cuisine", total: {$sum: 1} }` |
| `FROM restaurants` | `db.restaurants.aggregate([...])` |
| `WHERE borough = 'Manhattan'` | `$match: { borough: "Manhattan" }` |
| `GROUP BY cuisine` | `_id: "$cuisine"` |
| `HAVING COUNT(*) > 100` | `$match: { total: { $gt: 100 } }` (après $group) |
| `ORDER BY total DESC` | `$sort: { total: -1 }` |
| `LIMIT 10` | `$limit: 10` |

**Requête SQL complète :**
```sql
SELECT cuisine, COUNT(*) as total
FROM restaurants
WHERE borough = 'Manhattan'
GROUP BY cuisine
HAVING COUNT(*) > 100
ORDER BY total DESC
LIMIT 10;
```

**Équivalent MongoDB :**
```javascript
db.restaurants.aggregate([
    { $match: { borough: "Manhattan" } },
    { $group: { _id: "$cuisine", total: { $sum: 1 } } },
    { $match: { total: { $gt: 100 } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
])
```

#### Exercice 7 : Pipeline simple
Créer un pipeline qui affiche le **nombre de restaurants par quartier**, trié du plus grand au plus petit.

```javascript
// Votre réponse :

```

#### Exercice 8 : Pipeline avec filtre
Créer un pipeline qui affiche le **top 5 des types de cuisine à Manhattan**.

```javascript
// Votre réponse :

```

#### Exercice 9 : Groupement multiple
Créer un pipeline qui affiche, **pour chaque quartier**, le nombre de types de cuisine différents.

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

Utilisez `$addToSet` pour collecter les cuisines uniques, puis `$size` dans un `$project` pour compter.

Ou bien, groupez d'abord par (borough, cuisine), puis regroupez par borough en comptant.

</details>

### Récapitulatif Phase 2

```javascript
// Structure type d'un pipeline d'agrégation
db.collection.aggregate([
    { $match: { /* filtrer */ } },           // WHERE
    { $group: { _id: "$champ", /* ... */ }}, // GROUP BY
    { $match: { /* condition sur agrégat */ }}, // HAVING
    { $sort: { champ: -1 } },                // ORDER BY
    { $limit: 10 }                           // LIMIT
])
```

---

## Phase 3 : Transformation des données (45 min)

Cette phase introduit les opérateurs de transformation : `$project`, `$unwind` et `$addFields`.

### 3.1 Étape $project : Remodeler les documents

`$project` permet de :
- Sélectionner les champs à inclure/exclure
- Renommer des champs
- Créer des champs calculés

```javascript
// Sélectionner et renommer des champs
db.restaurants.aggregate([
    { $project: {
        _id: 0,                          // Exclure _id
        nom: "$name",                    // Renommer name → nom
        quartier: "$borough",
        type_cuisine: "$cuisine"
    }},
    { $limit: 3 }
])
```

#### Champs calculés dans $project

```javascript
db.restaurants.aggregate([
    { $project: {
        name: 1,
        borough: 1,
        // Nombre d'inspections
        nb_inspections: { $size: "$grades" },
        // Adresse complète
        adresse_complete: {
            $concat: ["$address.building", " ", "$address.street"]
        }
    }},
    { $limit: 5 }
])
```

### 3.2 Étape $addFields : Ajouter des champs

`$addFields` ajoute de nouveaux champs **sans supprimer les existants** (contrairement à `$project`).

```javascript
db.restaurants.aggregate([
    { $addFields: {
        nb_inspections: { $size: "$grades" },
        a_des_inspections: { $gt: [{ $size: "$grades" }, 0] }
    }},
    { $limit: 3 }
])
```

**Différence avec $project :**
- `$project` : vous devez lister tous les champs à garder
- `$addFields` : garde tous les champs et en ajoute de nouveaux

### 3.3 Étape $unwind : Dérouler les tableaux

`$unwind` transforme un document avec un tableau en **plusieurs documents**, un par élément du tableau.

```
AVANT $unwind :
{ name: "Pizza Roma", grades: [{grade:"A"}, {grade:"B"}] }

APRÈS $unwind sur grades :
{ name: "Pizza Roma", grades: {grade:"A"} }
{ name: "Pizza Roma", grades: {grade:"B"} }
```

```javascript
// Dérouler le tableau grades
db.restaurants.aggregate([
    { $match: { name: "Pizza Roma" } },
    { $unwind: "$grades" },
    { $project: {
        name: 1,
        grade: "$grades.grade",
        score: "$grades.score",
        date: "$grades.date"
    }}
])
```

#### Cas d'usage : Analyser les éléments individuels

```javascript
// Distribution des grades (A, B, C) sur TOUTES les inspections
db.restaurants.aggregate([
    { $unwind: "$grades" },
    { $group: {
        _id: "$grades.grade",
        count: { $sum: 1 }
    }},
    { $sort: { count: -1 } }
])
```

#### Exercice 10 : $unwind + $group
Calculer le **score moyen par année** pour toutes les inspections.

```javascript
// Pipeline :
// 1. $unwind sur grades
// 2. Extraire l'année avec $year
// 3. $group par année avec $avg sur le score
// 4. $sort par année

// Votre réponse :

```

<details>
<summary>Indice</summary>

Pour extraire l'année d'une date dans `$group`, utilisez :
```javascript
{ $group: {
    _id: { $year: "$grades.date" },
    avg_score: { $avg: "$grades.score" }
}}
```

</details>

#### Exercice 11 : Analyse des tendances
Pour chaque **quartier**, calculer :
- Le nombre total d'inspections (pas de restaurants!)
- Le score moyen de toutes les inspections

```javascript
// Votre réponse :

```

### 3.4 Options de $unwind

```javascript
// Conserver les documents sans tableau (ou tableau vide)
{ $unwind: {
    path: "$grades",
    preserveNullAndEmptyArrays: true
}}

// Ajouter l'index de l'élément
{ $unwind: {
    path: "$grades",
    includeArrayIndex: "position"
}}
```

### Récapitulatif Phase 3

| Étape | Usage | Conserve les champs ? |
|-------|-------|----------------------|
| `$project` | Sélectionner/transformer des champs | Non (seulement ceux listés) |
| `$addFields` | Ajouter des champs calculés | Oui (tous) |
| `$unwind` | Dérouler un tableau en documents | Oui |

---

## Phase 4 : Agrégations avancées (50 min)

### 4.1 Étape $lookup : Les jointures

`$lookup` permet de joindre des documents de différentes collections, similaire au `JOIN` SQL.

#### Préparation : Créer une collection de référence

```javascript
// Collection des quartiers avec leurs caractéristiques
db.boroughs.insertMany([
    { _id: "Manhattan", population: 1628706, area_km2: 59.1 },
    { _id: "Brooklyn", population: 2559903, area_km2: 183.4 },
    { _id: "Queens", population: 2253858, area_km2: 283.0 },
    { _id: "Bronx", population: 1418207, area_km2: 110.0 },
    { _id: "Staten Island", population: 476143, area_km2: 151.1 }
])
```

#### Syntaxe de $lookup

```javascript
db.restaurants.aggregate([
    { $lookup: {
        from: "boroughs",        // Collection à joindre
        localField: "borough",   // Champ dans restaurants
        foreignField: "_id",     // Champ dans boroughs
        as: "borough_info"       // Nom du champ résultat (tableau)
    }},
    { $limit: 2 }
])
```

**Résultat :** Chaque restaurant a maintenant un champ `borough_info` contenant un tableau avec les informations du quartier.

#### Extraire le résultat de la jointure

Le résultat de `$lookup` est toujours un **tableau**. Pour obtenir un objet, utilisez `$unwind` :

```javascript
db.restaurants.aggregate([
    { $lookup: {
        from: "boroughs",
        localField: "borough",
        foreignField: "_id",
        as: "borough_info"
    }},
    { $unwind: "$borough_info" },  // Transformer le tableau en objet
    { $project: {
        name: 1,
        borough: 1,
        population_quartier: "$borough_info.population"
    }},
    { $limit: 5 }
])
```

#### Exercice 12 : Jointure avec calcul
Créer un rapport montrant pour chaque quartier :
- Le nombre de restaurants
- La population du quartier
- La densité de restaurants (nb_restaurants / population * 10000)

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

1. `$group` par borough pour compter les restaurants
2. `$lookup` vers boroughs
3. `$unwind` le résultat
4. `$project` pour calculer la densité avec `$divide`

</details>

### 4.2 Étape $bucket : Créer des histogrammes

`$bucket` regroupe les documents dans des **tranches** (buckets) définies par des limites.

```javascript
// Distribution des scores d'inspection par tranches
db.restaurants.aggregate([
    { $unwind: "$grades" },
    { $bucket: {
        groupBy: "$grades.score",
        boundaries: [0, 10, 20, 30, 50, 100],  // Tranches : 0-9, 10-19, 20-29, 30-49, 50+
        default: "Hors limites",               // Pour les valeurs en dehors
        output: {
            count: { $sum: 1 },
            avg_score: { $avg: "$grades.score" }
        }
    }}
])
```

**Résultat :**
```javascript
[
  { _id: 0, count: 45234, avg_score: 5.2 },    // Scores 0-9
  { _id: 10, count: 32156, avg_score: 12.8 },  // Scores 10-19
  { _id: 20, count: 8934, avg_score: 23.1 },   // Scores 20-29
  // ...
]
```

#### Exercice 13 : Histogramme
Créer un histogramme du **nombre de restaurants par nombre d'inspections** :
- Tranches : 0, 1-2, 3-4, 5-6, 7+

```javascript
// Votre réponse :

```

<details>
<summary>Indice</summary>

1. D'abord, calculez le nombre d'inspections par restaurant avec `$addFields` et `$size`
2. Ensuite, utilisez `$bucket` avec `boundaries: [0, 1, 3, 5, 7, 20]`

</details>

### 4.3 Étape $facet : Analyses parallèles

`$facet` permet d'exécuter **plusieurs pipelines en parallèle** sur les mêmes données.

```javascript
db.restaurants.aggregate([
    { $facet: {
        // Pipeline 1 : Top 5 des cuisines
        par_cuisine: [
            { $group: { _id: "$cuisine", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ],

        // Pipeline 2 : Répartition par quartier
        par_quartier: [
            { $group: { _id: "$borough", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ],

        // Pipeline 3 : Statistiques globales
        stats_globales: [
            { $group: {
                _id: null,
                total: { $sum: 1 },
                nb_cuisines: { $addToSet: "$cuisine" }
            }},
            { $project: {
                _id: 0,
                total_restaurants: "$total",
                nb_types_cuisine: { $size: "$nb_cuisines" }
            }}
        ]
    }}
])
```

**Résultat :** Un seul document avec trois champs, chacun contenant le résultat d'un pipeline.

#### Exercice 14 : Dashboard multi-facettes
Créer un `$facet` qui produit :
1. Le nombre de restaurants par quartier
2. La distribution des grades (A, B, C, etc.)
3. Le top 3 des cuisines à Manhattan

```javascript
// Votre réponse :

```

### Récapitulatif Phase 4

| Étape | Usage | Cas d'utilisation |
|-------|-------|-------------------|
| `$lookup` | Jointure entre collections | Enrichir les données avec des références |
| `$bucket` | Regrouper en tranches | Histogrammes, analyses de distribution |
| `$facet` | Pipelines parallèles | Dashboards, analyses multi-critères |

---

## Phase 5 : Index et optimisation (30 min)

### 5.1 Pourquoi les index ?

Sans index, MongoDB doit parcourir **tous les documents** pour trouver ceux qui correspondent à la requête (COLLSCAN).

Avec un index, MongoDB peut **accéder directement** aux documents concernés (IXSCAN).

### 5.2 Analyser les performances avec explain()

```javascript
// Analyser une requête
db.restaurants.find({ cuisine: "Italian" }).explain("executionStats")
```

**Métriques importantes :**
- `executionTimeMillis` : temps d'exécution
- `totalDocsExamined` : documents parcourus
- `stage` : "COLLSCAN" (mauvais) vs "IXSCAN" (bon)

### 5.3 Créer des index

```javascript
// Index simple
db.restaurants.createIndex({ cuisine: 1 })

// Index composé (ordre important!)
db.restaurants.createIndex({ borough: 1, cuisine: 1 })

// Voir les index existants
db.restaurants.getIndexes()

// Supprimer un index
db.restaurants.dropIndex({ cuisine: 1 })
```

### 5.4 Index composés : l'ordre compte

Pour un index `{ borough: 1, cuisine: 1 }` :

| Requête | Utilise l'index ? |
|---------|-------------------|
| `{ borough: "Manhattan" }` | Oui |
| `{ borough: "Manhattan", cuisine: "Italian" }` | Oui |
| `{ cuisine: "Italian" }` | Non (préfixe manquant) |

**Règle :** Un index composé peut être utilisé pour des requêtes sur ses **préfixes**.

### 5.5 Index géospatiaux

Pour les requêtes de proximité, MongoDB nécessite un index spécial :

```javascript
// Créer un index géospatial
db.restaurants.createIndex({ "address.coord": "2dsphere" })

// Requête : restaurants dans un rayon de 500m
db.restaurants.find({
    "address.coord": {
        $nearSphere: {
            $geometry: {
                type: "Point",
                coordinates: [-73.985130, 40.758896]  // Times Square
            },
            $maxDistance: 500  // mètres
        }
    }
}).limit(10)
```

#### Exercice 15 : Optimisation
Cette requête est lente. Créez l'index optimal et mesurez l'amélioration.

```javascript
// Requête à optimiser
db.restaurants.find({
    borough: "Brooklyn",
    cuisine: "Italian"
}).sort({ name: 1 })

// 1. Mesurer AVANT (noter totalDocsExamined et executionTimeMillis)
db.restaurants.find({
    borough: "Brooklyn",
    cuisine: "Italian"
}).sort({ name: 1 }).explain("executionStats")

// 2. Créer l'index optimal
// Votre réponse :

// 3. Mesurer APRÈS
```

<details>
<summary>Solution</summary>

```javascript
// Index optimal : champs de filtre + champ de tri
db.restaurants.createIndex({ borough: 1, cuisine: 1, name: 1 })
```

L'index couvre le filtre (borough, cuisine) ET le tri (name), évitant un tri en mémoire.

</details>

#### Exercice 16 : Recherche géospatiale
Trouver les 5 restaurants italiens les plus proches de Central Park (coordonnées : [-73.965355, 40.782865]).

```javascript
// 1. Créer l'index géospatial si nécessaire

// 2. Votre requête :

```

### Récapitulatif Phase 5

| Type d'index | Syntaxe | Usage |
|--------------|---------|-------|
| Simple | `{ field: 1 }` | Requêtes sur un champ |
| Composé | `{ field1: 1, field2: 1 }` | Requêtes multi-champs |
| Géospatial | `{ field: "2dsphere" }` | Requêtes de proximité |

---

## Phase 6 : Mini-projet - Dashboard avec API REST (45 min)

Dans cette phase finale, vous allez **intégrer vos pipelines MongoDB dans une vraie application** composée de :
- Une **API REST** (Node.js/Express) qui expose vos requêtes d'agrégation
- Un **dashboard web** qui affiche les métriques sous forme de graphiques

Cette architecture en couches est exactement celle que vous utiliserez pour votre projet fil rouge.

### Architecture de l'application

```
┌─────────────────┐     HTTP/JSON     ┌─────────────────┐     Driver      ┌─────────────────┐
│   Dashboard     │ ◄───────────────► │   API REST      │ ◄─────────────► │   MongoDB       │
│   (Front-end)   │                   │   (Express)     │                 │   Atlas         │
│   HTML/JS       │                   │   Node.js       │                 │                 │
└─────────────────┘                   └─────────────────┘                 └─────────────────┘
     Port 5500                             Port 3000                        Cloud
```

### 6.1 Structure du projet

```
tp2/
├── README.md
├── playground-tp2.mongodb.js
├── solutions-tp2.mongodb.js
├── dashboard-api/              ← API REST (à compléter)
│   ├── package.json
│   ├── server.js               ← Routes avec TODO
│   ├── server.solution.js      ← Solution complète
│   └── .env.example
└── dashboard-front/            ← Interface web (fourni)
    └── index.html
```

### 6.2 Installation et configuration

#### Étape 1 : Configurer l'API

```bash
# Aller dans le dossier API
cd dashboard-api

# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env
```

Éditez le fichier `.env` avec votre URI MongoDB Atlas :
```
MONGODB_URI=mongodb+srv://VOTRE_USER:VOTRE_PASSWORD@cluster.mongodb.net/sample_restaurants
PORT=3000
```

#### Étape 2 : Démarrer l'API

```bash
# Démarrer le serveur (avec auto-reload)
npm run dev

# Ou sans auto-reload
npm start
```

Vous devriez voir :
```
✅ Connecté à MongoDB Atlas
🚀 API démarrée sur http://localhost:3000
```

#### Étape 3 : Tester l'API

```bash
# Test de santé
curl http://localhost:3000/api/health

# Test d'une route (retourne "TODO" tant que non implémentée)
curl http://localhost:3000/api/stats/overview
```

#### Étape 4 : Lancer le dashboard

Ouvrez `dashboard-front/index.html` dans votre navigateur (double-clic ou via Live Server dans VS Code).

Le dashboard affichera **"TODO"** pour chaque métrique tant que vous n'aurez pas complété les pipelines.

### 6.3 Votre mission : Compléter les routes API

Ouvrez `dashboard-api/server.js` et complétez les 5 pipelines d'agrégation :

#### Route 1 : `/api/stats/overview`
```javascript
// GET /api/stats/overview
// Retourne : { total_restaurants: 25359, total_cuisines: 85 }
const pipeline = [
    // TODO: Utiliser $group avec $addToSet et $size
];
```

#### Route 2 : `/api/stats/par-quartier`
```javascript
// GET /api/stats/par-quartier
// Retourne : [{ _id: "Manhattan", count: 10259 }, ...]
const pipeline = [
    // TODO: Utiliser $group et $sort
];
```

#### Route 3 : `/api/stats/top-cuisines`
```javascript
// GET /api/stats/top-cuisines
// Retourne : [{ _id: "American", count: 6183 }, ...] (top 10)
const pipeline = [
    // TODO: Utiliser $group, $sort et $limit
];
```

#### Route 4 : `/api/stats/distribution-grades`
```javascript
// GET /api/stats/distribution-grades
// Retourne : [{ _id: "A", count: 80234 }, { _id: "B", count: 15678 }, ...]
const pipeline = [
    // TODO: Utiliser $unwind, puis $group
];
```

#### Route 5 : `/api/stats/evolution-scores`
```javascript
// GET /api/stats/evolution-scores
// Retourne : [{ _id: 2012, avg_score: 10.5 }, ...]
const pipeline = [
    // TODO: Utiliser $unwind, $group avec $year, et $avg
];
```

### 6.4 Validation

Au fur et à mesure que vous complétez les pipelines :
1. **Sauvegardez** `server.js` (le serveur redémarre automatiquement avec `npm run dev`)
2. **Rafraîchissez** le dashboard dans le navigateur
3. Les graphiques passent de **"TODO"** à des **vraies données**

**Objectif final :** Tous les graphiques affichent des données réelles !

### 6.5 Bonus : Route `/api/stats/dashboard`

Pour les plus avancés, complétez la route bonus qui utilise `$facet` pour retourner **toutes les métriques en un seul appel** :

```javascript
// GET /api/stats/dashboard
// Retourne toutes les métriques en une seule requête
const pipeline = [
    { $facet: {
        overview: [ /* ... */ ],
        par_quartier: [ /* ... */ ],
        top_cuisines: [ /* ... */ ],
        distribution_grades: [ /* ... */ ],
        evolution_scores: [ /* ... */ ]
    }}
];
```

### 6.6 Ce que vous avez appris

Cette phase vous a permis de comprendre :

| Concept | Application |
|---------|-------------|
| **Séparation des couches** | Front (affichage) ↔ API (logique) ↔ BDD (données) |
| **API REST** | Routes HTTP qui exposent des données JSON |
| **Driver MongoDB** | Connexion et requêtes depuis Node.js |
| **Agrégation en production** | Vos pipelines MongoDB dans une vraie application |

C'est exactement cette architecture que vous utiliserez pour votre **projet fil rouge** !

---

## Checklist de validation

Avant de terminer ce TP, vérifiez que vous maîtrisez :

### Requêtes avancées
- [ ] `$elemMatch` pour conditions sur le même élément d'un tableau
- [ ] `$expr` pour utiliser des expressions d'agrégation dans find()
- [ ] `$type` et `$exists` pour la validation de données

### Pipeline d'agrégation
- [ ] `$match` pour filtrer (équivalent WHERE)
- [ ] `$group` avec accumulateurs ($sum, $avg, $addToSet...)
- [ ] `$sort` et `$limit` pour ordonner et limiter
- [ ] `$project` et `$addFields` pour transformer
- [ ] `$unwind` pour dérouler les tableaux

### Agrégations avancées
- [ ] `$lookup` pour les jointures entre collections
- [ ] `$bucket` pour créer des histogrammes
- [ ] `$facet` pour des analyses parallèles

### Optimisation
- [ ] `explain()` pour analyser les performances
- [ ] Création d'index simples et composés
- [ ] Index géospatiaux pour les requêtes de proximité

### Intégration (Phase 6)
- [ ] Connexion Node.js/MongoDB avec le driver officiel
- [ ] Création d'une API REST avec Express
- [ ] Intégration des pipelines dans des routes HTTP
- [ ] Visualisation des données avec Chart.js

---

## Ressources

- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)
- [Index Strategies](https://docs.mongodb.com/manual/indexes/)
- [Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)

---

**Prochain TP :** Modélisation avancée et patterns de conception MongoDB
