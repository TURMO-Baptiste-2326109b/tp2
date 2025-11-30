// ============================================================================
// Tests unitaires pour les pipelines MongoDB
// TP2 - Dashboard Restaurants NYC
// ============================================================================
//
// Ces tests vérifient que vos pipelines d'agrégation retournent les bonnes
// structures de données. Lancez-les avec : npm test
//
// IMPORTANT : Les tests ÉCHOUENT si les pipelines ne sont pas implémentés !
// Copiez vos pipelines depuis src/routes/stats.js dans ce fichier pour les tester.
//
// ============================================================================

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// ============================================================================
// Configuration
// ============================================================================

let client;
let db;

before(async () => {
    if (!process.env.MONGODB_URI) {
        console.error('\n❌ MONGODB_URI non défini dans .env');
        console.error('   Créez le fichier .env avec votre URI MongoDB Atlas\n');
        process.exit(1);
    }

    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const dbName = process.env.MONGODB_DATABASE || 'sample_restaurants';
        db = client.db(dbName);
        console.log('\n✅ Connecté à MongoDB Atlas pour les tests\n');
    } catch (error) {
        console.error('\n❌ Erreur de connexion:', error.message);
        process.exit(1);
    }
});

after(async () => {
    if (client) {
        await client.close();
        console.log('\n✅ Connexion MongoDB fermée\n');
    }
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Exécute un pipeline et retourne le résultat
 */
async function executePipeline(pipeline) {
    return await db.collection('restaurants').aggregate(pipeline).toArray();
}

/**
 * Vérifie qu'un pipeline n'est pas vide (non implémenté)
 */
function assertPipelineNotEmpty(pipeline, routeName) {
    assert.ok(Array.isArray(pipeline),
        `Le pipeline ${routeName} doit être un tableau`);
    assert.ok(pipeline.length > 0,
        `Le pipeline ${routeName} est vide - copiez votre implémentation depuis src/routes/stats.js !`);
}

// ============================================================================
// TEST 1 : Pipeline Overview
// Route : GET /api/stats/overview
// ============================================================================

describe('Pipeline Overview (/api/stats/overview)', () => {

    it('doit retourner un objet avec total_restaurants et total_cuisines', async () => {
        // TODO: Copiez votre pipeline ici pour le tester
        const pipeline = [
            // Votre pipeline overview...
            // Exemple attendu:
            // { $group: { _id: null, total_restaurants: { $sum: 1 }, cuisines: { $addToSet: "$cuisine" } } },
            // { $project: { _id: 0, total_restaurants: 1, total_cuisines: { $size: "$cuisines" } } }
        ];

        // Vérifier que le pipeline est implémenté
        assertPipelineNotEmpty(pipeline, 'overview');

        const result = await executePipeline(pipeline);

        assert.strictEqual(result.length, 1,
            `Le pipeline doit retourner exactement 1 document, reçu: ${result.length}`);
        assert.ok('total_restaurants' in result[0],
            'Le résultat doit contenir le champ total_restaurants');
        assert.ok('total_cuisines' in result[0],
            'Le résultat doit contenir le champ total_cuisines');
        assert.strictEqual(typeof result[0].total_restaurants, 'number',
            `total_restaurants doit être un nombre, reçu: ${typeof result[0].total_restaurants}`);
        assert.strictEqual(typeof result[0].total_cuisines, 'number',
            `total_cuisines doit être un nombre, reçu: ${typeof result[0].total_cuisines}`);

        // Vérifications de cohérence avec le dataset sample_restaurants
        assert.ok(result[0].total_restaurants > 20000,
            `Il devrait y avoir > 20000 restaurants, reçu: ${result[0].total_restaurants}`);
        assert.ok(result[0].total_cuisines > 50,
            `Il devrait y avoir > 50 types de cuisine, reçu: ${result[0].total_cuisines}`);

        console.log(`   ✅ total_restaurants: ${result[0].total_restaurants}`);
        console.log(`   ✅ total_cuisines: ${result[0].total_cuisines}`);
    });
});

// ============================================================================
// TEST 2 : Pipeline Par Quartier
// Route : GET /api/stats/par-quartier
// ============================================================================

describe('Pipeline Par Quartier (/api/stats/par-quartier)', () => {

    it('doit retourner les 5 quartiers de NYC avec leur nombre de restaurants', async () => {
        const pipeline = [
            // Votre pipeline par-quartier...
            // Exemple attendu:
            // { $group: { _id: "$borough", count: { $sum: 1 } } },
            // { $sort: { count: -1 } }
        ];

        // Vérifier que le pipeline est implémenté
        assertPipelineNotEmpty(pipeline, 'par-quartier');

        const result = await executePipeline(pipeline);

        assert.strictEqual(result.length, 5,
            `Il doit y avoir exactement 5 quartiers, reçu: ${result.length}`);

        const quartiers = result.map(r => r._id);
        const expectedQuartiers = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

        expectedQuartiers.forEach(q => {
            assert.ok(quartiers.includes(q),
                `Le quartier "${q}" doit être présent. Quartiers trouvés: ${quartiers.join(', ')}`);
        });

        result.forEach(r => {
            assert.ok(r._id, 'Chaque résultat doit avoir un _id (quartier)');
            assert.ok('count' in r, 'Chaque résultat doit avoir un count');
            assert.strictEqual(typeof r.count, 'number',
                `count doit être un nombre pour ${r._id}, reçu: ${typeof r.count}`);
        });

        // Vérifier le tri décroissant
        for (let i = 0; i < result.length - 1; i++) {
            assert.ok(result[i].count >= result[i + 1].count,
                `Le tri doit être décroissant: ${result[i]._id}(${result[i].count}) >= ${result[i + 1]._id}(${result[i + 1].count})`);
        }

        console.log('   ✅ Quartiers:', result.map(r => `${r._id}(${r.count})`).join(', '));
    });
});

// ============================================================================
// TEST 3 : Pipeline Top Cuisines
// Route : GET /api/stats/top-cuisines
// ============================================================================

describe('Pipeline Top Cuisines (/api/stats/top-cuisines)', () => {

    it('doit retourner le top 10 des cuisines', async () => {
        const pipeline = [
            // Votre pipeline top-cuisines...
            // Exemple attendu:
            // { $group: { _id: "$cuisine", count: { $sum: 1 } } },
            // { $sort: { count: -1 } },
            // { $limit: 10 }
        ];

        // Vérifier que le pipeline est implémenté
        assertPipelineNotEmpty(pipeline, 'top-cuisines');

        const result = await executePipeline(pipeline);

        assert.strictEqual(result.length, 10,
            `Il doit y avoir exactement 10 cuisines (top 10), reçu: ${result.length}`);

        result.forEach(r => {
            assert.ok(r._id, 'Chaque résultat doit avoir un _id (cuisine)');
            assert.ok('count' in r, 'Chaque résultat doit avoir un count');
            assert.strictEqual(typeof r.count, 'number',
                `count doit être un nombre pour ${r._id}, reçu: ${typeof r.count}`);
        });

        // Vérifier le tri décroissant
        for (let i = 0; i < result.length - 1; i++) {
            assert.ok(result[i].count >= result[i + 1].count,
                `Le tri doit être décroissant: ${result[i]._id}(${result[i].count}) >= ${result[i + 1]._id}(${result[i + 1].count})`);
        }

        // American devrait être en premier (c'est le cas dans sample_restaurants)
        assert.strictEqual(result[0]._id, 'American',
            `La cuisine #1 doit être "American", reçu: "${result[0]._id}"`);

        console.log('   ✅ Top 3:', result.slice(0, 3).map(r => `${r._id} (${r.count})`).join(', '));
    });
});

// ============================================================================
// TEST 4 : Pipeline Distribution Grades
// Route : GET /api/stats/distribution-grades
// ============================================================================

describe('Pipeline Distribution Grades (/api/stats/distribution-grades)', () => {

    it('doit retourner la distribution des grades A, B, C, etc.', async () => {
        const pipeline = [
            // Votre pipeline distribution-grades...
            // Exemple attendu:
            // { $unwind: "$grades" },
            // { $group: { _id: "$grades.grade", count: { $sum: 1 } } },
            // { $sort: { count: -1 } }
        ];

        // Vérifier que le pipeline est implémenté
        assertPipelineNotEmpty(pipeline, 'distribution-grades');

        const result = await executePipeline(pipeline);

        assert.ok(result.length >= 3,
            `Il doit y avoir au moins 3 grades différents (A, B, C), reçu: ${result.length}`);

        const grades = result.map(r => r._id);
        assert.ok(grades.includes('A'),
            `Le grade "A" doit être présent. Grades trouvés: ${grades.join(', ')}`);
        assert.ok(grades.includes('B'),
            `Le grade "B" doit être présent. Grades trouvés: ${grades.join(', ')}`);
        assert.ok(grades.includes('C'),
            `Le grade "C" doit être présent. Grades trouvés: ${grades.join(', ')}`);

        result.forEach(r => {
            assert.ok(r._id !== undefined, 'Chaque résultat doit avoir un _id (grade)');
            assert.ok('count' in r, 'Chaque résultat doit avoir un count');
            assert.strictEqual(typeof r.count, 'number',
                `count doit être un nombre pour grade ${r._id}, reçu: ${typeof r.count}`);
        });

        // Le grade A devrait être le plus fréquent (logique métier)
        const gradeA = result.find(r => r._id === 'A');
        const gradeC = result.find(r => r._id === 'C');
        assert.ok(gradeA && gradeC, 'Les grades A et C doivent exister');
        assert.ok(gradeA.count > gradeC.count,
            `Il devrait y avoir plus de A(${gradeA.count}) que de C(${gradeC.count})`);

        console.log('   ✅ Grades:', result.map(r => `${r._id}: ${r.count}`).join(', '));
    });
});

// ============================================================================
// TEST 5 : Pipeline Evolution Scores
// Route : GET /api/stats/evolution-scores
// ============================================================================

describe('Pipeline Evolution Scores (/api/stats/evolution-scores)', () => {

    it('doit retourner le score moyen par année', async () => {
        const pipeline = [
            // Votre pipeline evolution-scores...
            // Exemple attendu:
            // { $unwind: "$grades" },
            // { $group: { _id: { $year: "$grades.date" }, avg_score: { $avg: "$grades.score" } } },
            // { $sort: { _id: 1 } }
        ];

        // Vérifier que le pipeline est implémenté
        assertPipelineNotEmpty(pipeline, 'evolution-scores');

        const result = await executePipeline(pipeline);

        assert.ok(result.length >= 3,
            `Il doit y avoir au moins 3 années de données, reçu: ${result.length}`);

        result.forEach(r => {
            assert.ok(r._id, 'Chaque résultat doit avoir un _id (année)');
            assert.ok('avg_score' in r, 'Chaque résultat doit avoir un avg_score');
            assert.strictEqual(typeof r._id, 'number',
                `_id (année) doit être un nombre, reçu: ${typeof r._id}`);
            assert.strictEqual(typeof r.avg_score, 'number',
                `avg_score doit être un nombre, reçu: ${typeof r.avg_score}`);
            assert.ok(r._id >= 2010 && r._id <= 2020,
                `Année ${r._id} doit être entre 2010 et 2020`);
            assert.ok(r.avg_score >= 0 && r.avg_score <= 50,
                `Score moyen ${r.avg_score} doit être entre 0 et 50`);
        });

        // Vérifier le tri par année croissante
        for (let i = 0; i < result.length - 1; i++) {
            assert.ok(result[i]._id <= result[i + 1]._id,
                `Le tri doit être par année croissante: ${result[i]._id} <= ${result[i + 1]._id}`);
        }

        console.log('   ✅ Evolution:', result.map(r => `${r._id}: ${r.avg_score.toFixed(1)}`).join(', '));
    });
});

// ============================================================================
// TEST BONUS : Pipeline Dashboard ($facet)
// Route : GET /api/stats/dashboard
// ============================================================================

describe('Pipeline Dashboard - BONUS (/api/stats/dashboard)', () => {

    it('doit retourner toutes les métriques en un seul appel avec $facet', async () => {
        const pipeline = [
            // Votre pipeline $facet...
            // Exemple attendu:
            // { $facet: {
            //     overview: [ { $group: { _id: null, ... } } ],
            //     par_quartier: [ { $group: { _id: "$borough", ... } }, { $sort: ... } ],
            //     top_cuisines: [ ... ],
            //     distribution_grades: [ ... ],
            //     evolution_scores: [ ... ]
            // }}
        ];

        // Vérifier que le pipeline est implémenté (BONUS)
        assertPipelineNotEmpty(pipeline, 'dashboard ($facet) - BONUS');

        const result = await executePipeline(pipeline);

        assert.strictEqual(result.length, 1,
            `$facet doit retourner exactement 1 document, reçu: ${result.length}`);

        const data = result[0];

        // Vérifier la présence de toutes les facettes
        assert.ok('overview' in data,
            'Le résultat doit contenir la facette "overview"');
        assert.ok('par_quartier' in data,
            'Le résultat doit contenir la facette "par_quartier"');
        assert.ok('top_cuisines' in data,
            'Le résultat doit contenir la facette "top_cuisines"');
        assert.ok('distribution_grades' in data,
            'Le résultat doit contenir la facette "distribution_grades"');
        assert.ok('evolution_scores' in data,
            'Le résultat doit contenir la facette "evolution_scores"');

        // Vérifier que chaque facette contient des données
        assert.ok(Array.isArray(data.overview),
            'overview doit être un tableau');
        assert.ok(Array.isArray(data.par_quartier),
            'par_quartier doit être un tableau');
        assert.strictEqual(data.par_quartier.length, 5,
            `par_quartier doit contenir 5 quartiers, reçu: ${data.par_quartier.length}`);
        assert.ok(Array.isArray(data.top_cuisines) && data.top_cuisines.length > 0,
            'top_cuisines doit être un tableau non vide');
        assert.ok(Array.isArray(data.distribution_grades) && data.distribution_grades.length > 0,
            'distribution_grades doit être un tableau non vide');
        assert.ok(Array.isArray(data.evolution_scores) && data.evolution_scores.length > 0,
            'evolution_scores doit être un tableau non vide');

        console.log('   ✅ Toutes les facettes sont présentes et correctes');
    });
});

// ============================================================================
// TESTS DE VALIDATION RAPIDE (exécutés sur la vraie base)
// Ces tests vérifient directement les routes de l'API
// ============================================================================

describe('Validation des données MongoDB', () => {

    it('la collection restaurants existe et contient des données', async () => {
        const count = await db.collection('restaurants').countDocuments();
        assert.ok(count > 20000, `La collection devrait contenir plus de 20000 documents (trouvé: ${count})`);
        console.log(`   ✅ Collection restaurants: ${count} documents`);
    });

    it('les documents ont la structure attendue', async () => {
        const doc = await db.collection('restaurants').findOne();

        assert.ok(doc.name, 'Le document doit avoir un champ name');
        assert.ok(doc.borough, 'Le document doit avoir un champ borough');
        assert.ok(doc.cuisine, 'Le document doit avoir un champ cuisine');
        assert.ok(doc.grades, 'Le document doit avoir un champ grades');
        assert.ok(Array.isArray(doc.grades), 'grades doit être un tableau');

        if (doc.grades.length > 0) {
            assert.ok(doc.grades[0].grade, 'Chaque grade doit avoir un champ grade');
            assert.ok(doc.grades[0].score !== undefined, 'Chaque grade doit avoir un champ score');
            assert.ok(doc.grades[0].date, 'Chaque grade doit avoir un champ date');
        }

        console.log(`   ✅ Structure validée pour: ${doc.name}`);
    });
});
