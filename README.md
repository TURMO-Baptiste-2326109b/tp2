# TP2 : Requêtage avancé et pipeline d'agrégation MongoDB (4h)

## 🎯 Objectifs de la séance

### Objectifs pédagogiques
À l'issue de cette séance, vous serez capable de :
- **Maîtriser** les opérateurs avancés MongoDB ($elemMatch, $expr, $type...)
- **Construire** des pipelines d'agrégation complexes pour l'analyse de données
- **Optimiser** les requêtes avec les index appropriés  
- **Réaliser** des jointures entre collections avec $lookup
- **Analyser** des données temporelles et géospatiales

### Lien avec le projet SteamCity
Les concepts de cette séance sont essentiels pour votre projet IoT :
- **Agrégation temporelle** : moyennes horaires/journalières des capteurs
- **$bucket** : regroupement des mesures par tranches
- **$lookup** : jointure entre capteurs et mesures
- **Index composés** : optimisation des requêtes temps réel

### Prérequis
- ✅ TP1 complété (CRUD, documents imbriqués)
- ✅ Collection `mediatheque_but3` du TP1 disponible
- ✅ MongoDB Atlas configuré et accessible

---

## 📚 Phase 1 : Opérateurs de requête avancés (45 min)

### 1.1 Import du dataset restaurants

Pour cette séance, nous allons utiliser le célèbre dataset "restaurants" de MongoDB qui contient des données réelles de restaurants new-yorkais.

```javascript
// 1. Télécharger le dataset (dans votre terminal local)
wget https://raw.githubusercontent.com/mongodb/docs-assets/primer-dataset/restaurants.json

// 2. Importer dans Atlas (remplacer par votre connection string)
mongoimport --uri "mongodb+srv://etudiant:password@cluster.mongodb.net/tp2_but3" \
            --collection restaurants \
            --file restaurants.json

// Ou directement dans Compass : 
// Collection → Add Data → Import File → restaurants.json
```

Structure d'un document restaurant :
```javascript
{
  "_id": ObjectId("..."),
  "address": {
    "building": "1007",
    "coord": [-73.856077, 40.848447],  // [longitude, latitude]
    "street": "Morris Park Ave",
    "zipcode": "10462"
  },
  "borough": "Bronx",              // Quartier de NYC
  "cuisine": "Bakery",              // Type de cuisine
  "grades": [                       // Historique des notes d'inspection
    {
      "date": ISODate("2014-03-03"),
      "grade": "A",                // A = Excellent, B = Good, C = Average
      "score": 2                    // Score numérique (plus bas = mieux)
    },
    {
      "date": ISODate("2013-09-11"),
      "grade": "A",
      "score": 6
    }
  ],
  "name": "Morris Park Bake Shop",
  "restaurant_id": "30075445"
}
```

### 1.2 L'opérateur $elemMatch pour les tableaux complexes

#### Problème : Requêtes ambiguës sur tableaux d'objets

```javascript
// ❌ PROBLÈME : Cette requête est ambiguë
db.restaurants.find({
    "grades.grade": "A",
    "grades.score": {$gt: 10}
})
// Trouve les restaurants qui ont AU MOINS UN grade "A" 
// ET AU MOINS UN score > 10 (pas forcément le même!)
```

#### Solution : $elemMatch garantit que les conditions s'appliquent au MÊME élément

```javascript
// ✅ CORRECT : Un MÊME grade doit avoir "A" ET score > 10
db.restaurants.find({
    grades: {$elemMatch: {
        grade: "A",
        score: {$gt: 10}
    }}
})
```

#### Exercices $elemMatch

**Exercice 1 :** Trouver les restaurants qui ont reçu un grade "B" avec un score inférieur à 15
```javascript
// Votre réponse :

```

**Exercice 2 :** Trouver les restaurants qui ont eu une inspection en 2014 avec un grade "A"
```javascript
// Votre réponse :

```

**Exercice 3 :** Trouver les restaurants avec au moins une mauvaise inspection (grade "C" ou score > 30)
```javascript
// Votre réponse :

```

### 1.3 L'opérateur $expr pour les comparaisons entre champs

`$expr` permet de comparer des champs entre eux dans le même document.

```javascript
// Exemple : Dans notre médiathèque, livres où nombre_emprunts > note * 10
use mediatheque_but3
db.livres.find({
    $expr: {$gt: ["$nombre_emprunts_total", {$multiply: ["$note_moyenne", 10]}]}
})
```

#### Applications avec les restaurants

```javascript
// Restaurants où le dernier score est meilleur que le premier
db.restaurants.find({
    $expr: {
        $lt: [
            {$arrayElemAt: ["$grades.score", -1]},  // Dernier élément
            {$arrayElemAt: ["$grades.score", 0]}    // Premier élément
        ]
    }
})
```

**Exercice 4 :** Utiliser $expr pour trouver les restaurants où le nombre de grades est supérieur à 4
```javascript
// Votre réponse :

```

### 1.4 Opérateurs de type et existence

```javascript
// $type : vérifier le type d'un champ
db.restaurants.find({
    "address.coord": {$type: "array"}
})

// Types courants : "string", "number", "bool", "object", "array", "null", "date"

// $exists combiné avec $type pour validation
db.restaurants.find({
    grades: {$exists: true, $type: "array", $ne: []}
})
```

**Exercice 5 :** Trouver tous les restaurants où le zipcode n'est PAS une string
```javascript
// Votre réponse :

```

### 1.5 Recherche géospatiale

MongoDB supporte nativement les requêtes géospatiales !

```javascript
// Créer un index géospatial (une seule fois)
db.restaurants.createIndex({"address.coord": "2dsphere"})

// Trouver les restaurants dans un rayon de 500m d'un point
db.restaurants.find({
    "address.coord": {
        $nearSphere: {
            $geometry: {
                type: "Point",
                coordinates: [-73.856077, 40.848447]  // [lng, lat]
            },
            $maxDistance: 500  // en mètres
        }
    }
}).limit(5)
```

**Exercice 6 :** Trouver les 10 restaurants les plus proches de Times Square (coordonnées : [-73.985130, 40.758896])
```javascript
// Votre réponse :

```

---

## 🔄 Phase 2 : Pipeline d'agrégation - Les bases (60 min)

### 2.1 Comprendre le pipeline

Le pipeline d'agrégation est comme une chaîne de production où chaque étape transforme les données :

```mermaid
graph LR
    A[Documents] --> B[$match]
    B --> C[$group]
    C --> D[$sort]
    D --> E[$limit]
    E --> F[Résultat]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
```

### 2.2 Étapes essentielles du pipeline

#### $match : Filtrer les documents
```javascript
// Équivalent de WHERE en SQL
db.restaurants.aggregate([
    {$match: {cuisine: "Italian"}}
])
```

#### $group : Regrouper et calculer
```javascript
// Nombre de restaurants par quartier
db.restaurants.aggregate([
    {$group: {
        _id: "$borough",                    // GROUP BY borough
        count: {$sum: 1},                   // COUNT(*)
        avg_score: {$avg: "$grades.score"}  // AVG(score)
    }}
])
```

#### $project : Transformer les documents
```javascript
// Reformater les données
db.restaurants.aggregate([
    {$project: {
        nom_restaurant: "$name",             // Renommer
        annee: {$year: "$grades.date"},     // Extraire l'année
        note_moyenne: {$avg: "$grades.score"} // Calculer
    }}
])
```

### 2.3 Analyse des restaurants par cuisine

**Exercice 7 :** Créer un pipeline qui :
1. Filtre les restaurants de Manhattan
2. Groupe par type de cuisine
3. Calcule le nombre et le score moyen
4. Trie par nombre décroissant
5. Limite aux 10 premiers

```javascript
// Votre réponse :

```

### 2.4 Dérouler des tableaux avec $unwind

```javascript
// Problème : grades est un tableau
db.restaurants.findOne().grades  // [{...}, {...}, {...}]

// Solution : $unwind transforme chaque élément en document séparé
db.restaurants.aggregate([
    {$unwind: "$grades"},
    {$limit: 5}
])
// Résultat : 1 document par grade au lieu de 1 par restaurant
```

**Exercice 8 :** Calculer la note moyenne par année pour tous les restaurants
```javascript
// Pipeline :
// 1. $unwind sur grades
// 2. $project pour extraire l'année
// 3. $group par année
// 4. $sort par année

// Votre réponse :

```

---

## 🔗 Phase 3 : Jointures et agrégations avancées (60 min)

### 3.1 $lookup : Les jointures MongoDB

Créons d'abord des données pour tester les jointures :

```javascript
// Collection des quartiers avec informations supplémentaires
db.boroughs.insertMany([
    {
        _id: "Manhattan",
        population: 1628706,
        area_km2: 59.1,
        description: "Centre économique et culturel"
    },
    {
        _id: "Brooklyn", 
        population: 2559903,
        area_km2: 183.4,
        description: "Quartier résidentiel branché"
    },
    {
        _id: "Queens",
        population: 2253858,
        area_km2: 283.0,
        description: "Le plus diversifié ethniquement"
    },
    {
        _id: "Bronx",
        population: 1418207,
        area_km2: 110.0,
        description: "Berceau du hip-hop"
    },
    {
        _id: "Staten Island",
        population: 476143,
        area_km2: 151.1,
        description: "Le plus suburbain"
    }
])
```

#### Syntaxe du $lookup
```javascript
db.restaurants.aggregate([
    {$match: {cuisine: "Italian"}},
    {$group: {
        _id: "$borough",
        restaurant_count: {$sum: 1}
    }},
    {$lookup: {
        from: "boroughs",           // Collection à joindre
        localField: "_id",          // Champ local (restaurants groupés)
        foreignField: "_id",        // Champ distant (boroughs)
        as: "borough_info"          // Nom du tableau résultat
    }},
    {$unwind: "$borough_info"},     // Transformer tableau en objet
    {$project: {
        quartier: "$_id",
        nb_restaurants: "$restaurant_count",
        population: "$borough_info.population",
        densite_resto: {
            $divide: ["$restaurant_count", "$borough_info.population"]
        }
    }}
])
```

**Exercice 9 :** Créer un rapport montrant pour chaque quartier :
- Le nombre de types de cuisine différents
- La population
- Le ratio cuisines/km²

```javascript
// Votre réponse :

```

### 3.2 $facet : Analyses multiples en parallèle

`$facet` permet d'exécuter plusieurs pipelines en une seule requête :

```javascript
db.restaurants.aggregate([
    {$facet: {
        // Pipeline 1 : Top cuisines
        top_cuisines: [
            {$group: {_id: "$cuisine", count: {$sum: 1}}},
            {$sort: {count: -1}},
            {$limit: 5}
        ],
        
        // Pipeline 2 : Statistiques par quartier
        stats_borough: [
            {$group: {
                _id: "$borough",
                total: {$sum: 1},
                cuisines: {$addToSet: "$cuisine"}
            }},
            {$project: {
                quartier: "$_id",
                total: 1,
                nb_cuisines: {$size: "$cuisines"}
            }}
        ],
        
        // Pipeline 3 : Evolution temporelle
        evolution: [
            {$unwind: "$grades"},
            {$project: {
                year: {$year: "$grades.date"},
                score: "$grades.score"
            }},
            {$group: {
                _id: "$year",
                avg_score: {$avg: "$score"}
            }},
            {$sort: {_id: 1}}
        ]
    }}
])
```

### 3.3 $bucket : Regroupement par tranches

Parfait pour créer des histogrammes :

```javascript
// Distribution des scores d'inspection
db.restaurants.aggregate([
    {$unwind: "$grades"},
    {$bucket: {
        groupBy: "$grades.score",
        boundaries: [0, 10, 20, 30, 40, 50, 100],  // Tranches
        default: "Autres",
        output: {
            count: {$sum: 1},
            restaurants: {$push: "$name"}
        }
    }}
])
```

**Exercice 10 :** Créer un histogramme du nombre de restaurants par tranches de notes moyennes
```javascript
// Tranches : [0-2], [2-4], [4-4.5], [4.5-5]
// Votre réponse :

```

---

## 📈 Phase 4 : Analyse temporelle et patterns IoT (45 min)

### 4.1 Préparation pour SteamCity - Données de capteurs

Créons un dataset similaire à celui de votre projet :

```javascript
use iot_demo

// Générer des données de capteurs
let sensors = ["SENS-001", "SENS-002", "SENS-003"];
let startDate = new Date("2024-01-15T00:00:00Z");
let data = [];

for(let s = 0; s < sensors.length; s++) {
    for(let h = 0; h < 24; h++) {  // 24 heures
        for(let m = 0; m < 60; m += 5) {  // Toutes les 5 minutes
            data.push({
                sensor_id: sensors[s],
                timestamp: new Date(startDate.getTime() + h*3600000 + m*60000),
                temperature: 20 + Math.random() * 10,
                humidity: 40 + Math.random() * 30,
                co2: 400 + Math.random() * 100,
                location: {
                    type: "Point",
                    coordinates: [5.4 + s*0.01, 43.5 + s*0.01]
                }
            });
        }
    }
}

db.measurements.insertMany(data)
print(`Inserted ${data.length} measurements`)
```

### 4.2 Agrégations temporelles

#### Moyennes horaires (pattern pour SteamCity)
```javascript
db.measurements.aggregate([
    {$match: {sensor_id: "SENS-001"}},
    {$group: {
        _id: {
            date: {$dateToString: {format: "%Y-%m-%d", date: "$timestamp"}},
            hour: {$hour: "$timestamp"}
        },
        temp_avg: {$avg: "$temperature"},
        temp_min: {$min: "$temperature"},
        temp_max: {$max: "$temperature"},
        humidity_avg: {$avg: "$humidity"},
        count: {$sum: 1}
    }},
    {$sort: {"_id.date": 1, "_id.hour": 1}}
])
```

**Exercice 11 :** Créer un pipeline qui :
1. Regroupe les mesures par capteur et par heure
2. Calcule min, max, moyenne pour chaque métrique
3. Détecte les anomalies (température > 28°C)

```javascript
// Votre réponse :

```

### 4.3 Pattern Bucket pour time-series

Le pattern que vous utiliserez dans SteamCity :

```javascript
// Créer des buckets d'une heure
db.measurements.aggregate([
    {$group: {
        _id: {
            sensor_id: "$sensor_id",
            bucket_hour: {
                $dateTrunc: {
                    date: "$timestamp",
                    unit: "hour"
                }
            }
        },
        measurements: {$push: {
            ts: "$timestamp",
            temp: "$temperature",
            hum: "$humidity",
            co2: "$co2"
        }},
        stats: {$accumulator: {
            init: function() {
                return {temps: [], hums: [], co2s: []};
            },
            accumulate: function(state, temp, hum, co2) {
                state.temps.push(temp);
                state.hums.push(hum);
                state.co2s.push(co2);
                return state;
            },
            accumulateArgs: ["$temperature", "$humidity", "$co2"],
            merge: function(state1, state2) {
                return {
                    temps: state1.temps.concat(state2.temps),
                    hums: state1.hums.concat(state2.hums),
                    co2s: state1.co2s.concat(state2.co2s)
                };
            },
            lang: "js"
        }}
    }},
    {$project: {
        sensor_id: "$_id.sensor_id",
        bucket_start: "$_id.bucket_hour",
        measurement_count: {$size: "$measurements"},
        temperature_avg: {$avg: "$stats.temps"},
        humidity_avg: {$avg: "$stats.hums"},
        co2_avg: {$avg: "$stats.co2s"}
    }}
])
```

---

## 🚀 Phase 5 : Optimisation avec les index (30 min)

### 5.1 Analyser les performances

```javascript
// Sans index
db.restaurants.find({cuisine: "Italian", borough: "Manhattan"})
    .explain("executionStats")

// Regarder :
// - totalDocsExamined : documents scannés
// - executionTimeMillis : temps d'exécution
// - stage: "COLLSCAN" = parcours complet (mauvais!)
```

### 5.2 Créer et utiliser les index

```javascript
// Index simple
db.restaurants.createIndex({cuisine: 1})

// Index composé (ordre important!)
db.restaurants.createIndex({borough: 1, cuisine: 1})

// Index sur tableau
db.restaurants.createIndex({"grades.score": 1})

// Index géospatial (déjà créé)
db.restaurants.createIndex({"address.coord": "2dsphere"})

// Voir tous les index
db.restaurants.getIndexes()
```

**Exercice 12 :** 
1. Mesurer le temps de cette requête SANS index
2. Créer l'index optimal
3. Remesurer et comparer

```javascript
// Requête à optimiser :
db.restaurants.find({
    cuisine: "Chinese",
    "grades.score": {$lt: 10}
}).sort({name: 1})

// Votre réponse :

```

---

## 💼 Phase 6 : Mini-projet - Dashboard analytique (40 min)

### Mission : Créer un tableau de bord complet pour les restaurants

Vous devez créer une seule requête d'agrégation qui produit toutes les métriques nécessaires pour un dashboard de surveillance des restaurants de New York.

**Spécifications :**

Le dashboard doit contenir :
1. **Vue générale**
   - Nombre total de restaurants
   - Nombre de cuisines différentes
   - Score moyen global

2. **Top 5**
   - Les 5 cuisines les plus populaires
   - Les 5 meilleurs restaurants (par score moyen)
   - Les 5 quartiers avec le plus de restaurants

3. **Analyse qualité**
   - Distribution des grades (A, B, C)
   - Évolution du score moyen par année
   - Restaurants à risque (dernier grade C ou score > 30)

4. **Géographique**
   - Densité de restaurants par quartier
   - Type de cuisine dominant par quartier

```javascript
// Structure attendue du résultat :
{
    "overview": {
        "total_restaurants": 25359,
        "total_cuisines": 85,
        "global_avg_score": 11.5
    },
    "top_cuisines": [...],
    "top_restaurants": [...],
    "quality_metrics": {...},
    "geographic": {...}
}

// Votre pipeline complet :

```

---

## 📊 Synthèse : Patterns pour SteamCity

### Patterns essentiels pour votre projet IoT

1. **Bucketing temporel**
```javascript
// Regrouper les mesures par heure
{$group: {
    _id: {
        sensor: "$sensor_id",
        hour: {$dateTrunc: {date: "$timestamp", unit: "hour"}}
    },
    measurements: {$push: "$$ROOT"},
    stats: {/* calculs */}
}}
```

2. **Détection d'anomalies**
```javascript
// Identifier les valeurs hors normes
{$match: {
    $or: [
        {temperature: {$gt: 35}},
        {co2: {$gt: 1000}},
        {humidity: {$not: {$gte: 20, $lte: 80}}}
    ]
}}
```

3. **Agrégation géospatiale**
```javascript
// Moyennes par zone
{$group: {
    _id: {
        lat: {$round: [{$arrayElemAt: ["$location.coordinates", 1]}, 2]},
        lng: {$round: [{$arrayElemAt: ["$location.coordinates", 0]}, 2]}
    },
    avg_values: {/* ... */}
}}
```

---

## ✅ Checklist de validation

Avant de terminer ce TP, assurez-vous de maîtriser :

- [ ] `$elemMatch` pour requêtes sur tableaux d'objets
- [ ] `$expr` pour comparaisons entre champs
- [ ] Pipeline d'agrégation : `$match`, `$group`, `$project`, `$sort`
- [ ] `$unwind` pour dérouler les tableaux
- [ ] `$lookup` pour les jointures
- [ ] `$facet` pour analyses multiples
- [ ] `$bucket` pour les histogrammes
- [ ] Agrégations temporelles (par heure, jour)
- [ ] Création et utilisation d'index
- [ ] `explain()` pour analyser les performances

---

## 🏆 Challenge bonus : Préparation SteamCity

Si vous avez fini en avance, créez le modèle de données et les requêtes pour votre module SteamCity :

1. Modéliser les collections nécessaires pour votre module
2. Créer les index appropriés
3. Implémenter 3 requêtes d'analyse essentielles
4. Optimiser avec `explain()`

```javascript
// Votre modèle et requêtes :

```

---

## 📚 Ressources pour approfondir

- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)
- [Index Strategies](https://docs.mongodb.com/manual/indexes/)
- [Time Series Collections](https://docs.mongodb.com/manual/core/timeseries-collections/)
- [Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)

**Prochain TP :** Modélisation avancée et patterns de conception MongoDB
