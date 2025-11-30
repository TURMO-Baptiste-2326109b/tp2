// ============================================================================
// Tests d'intégration pour l'API Dashboard
// TP2 - Dashboard Restaurants NYC
// ============================================================================
//
// Ces tests appellent directement les routes de votre API et vérifient
// que les réponses sont correctes.
//
// IMPORTANT : L'API doit être démarrée avant de lancer ces tests !
//             npm start (dans un autre terminal)
//             puis : npm run test:api
//
// Les tests ÉCHOUENT si les routes ne sont pas implémentées.
// Complétez les pipelines dans src/routes/stats.js pour faire passer les tests.
//
// ============================================================================

const { describe, it, before } = require('node:test');
const assert = require('node:assert');

// ============================================================================
// Configuration
// ============================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Helper pour appeler l'API
 */
async function fetchAPI(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Vérifie qu'une valeur n'est pas un placeholder TODO
 */
function assertNotTodo(value, fieldName) {
    assert.notStrictEqual(value, 'TODO',
        `${fieldName} retourne "TODO" - implémentez le pipeline !`);
    assert.notStrictEqual(value, undefined,
        `${fieldName} est undefined - vérifiez votre pipeline`);
    assert.notStrictEqual(value, null,
        `${fieldName} est null - vérifiez votre pipeline`);
}

// ============================================================================
// Tests de connexion
// ============================================================================

describe('API - Connexion', () => {

    it('GET /api/health - doit répondre avec status ok', async () => {
        const data = await fetchAPI('/api/health');
        assert.strictEqual(data.status, 'ok', 'Le status doit être "ok"');
        console.log('   ✅ API opérationnelle');
    });
});

// ============================================================================
// Tests des routes (vérifient la structure, pas les valeurs exactes)
// ============================================================================

describe('API - Route /api/stats/overview', () => {

    it('doit retourner total_restaurants et total_cuisines', async () => {
        const data = await fetchAPI('/api/stats/overview');

        // Vérifier que ce n'est pas un TODO
        assert.ok('total_restaurants' in data, 'Doit contenir total_restaurants');
        assert.ok('total_cuisines' in data, 'Doit contenir total_cuisines');
        assertNotTodo(data.total_restaurants, 'total_restaurants');
        assertNotTodo(data.total_cuisines, 'total_cuisines');

        // Vérifier les types
        assert.strictEqual(typeof data.total_restaurants, 'number',
            `total_restaurants doit être un nombre, reçu: ${typeof data.total_restaurants}`);
        assert.strictEqual(typeof data.total_cuisines, 'number',
            `total_cuisines doit être un nombre, reçu: ${typeof data.total_cuisines}`);

        // Vérifier les valeurs
        assert.ok(data.total_restaurants > 20000,
            `Doit avoir > 20000 restaurants, reçu: ${data.total_restaurants}`);
        assert.ok(data.total_cuisines > 50,
            `Doit avoir > 50 cuisines, reçu: ${data.total_cuisines}`);

        console.log(`   ✅ ${data.total_restaurants} restaurants, ${data.total_cuisines} cuisines`);
    });
});

describe('API - Route /api/stats/par-quartier', () => {

    it('doit retourner un tableau avec les 5 quartiers de NYC', async () => {
        const data = await fetchAPI('/api/stats/par-quartier');

        // Vérifier la structure
        assert.ok(Array.isArray(data), 'Doit retourner un tableau');
        assert.ok(data.length > 0, 'Le tableau ne doit pas être vide');

        // Vérifier que ce n'est pas un TODO
        assertNotTodo(data[0]?.count, 'count du premier quartier');
        assertNotTodo(data[0]?._id, '_id du premier quartier');

        // Vérifier le nombre de quartiers
        assert.strictEqual(data.length, 5,
            `Doit avoir 5 quartiers (NYC), reçu: ${data.length}`);

        // Vérifier que tous les quartiers sont présents
        const quartiers = data.map(d => d._id);
        ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].forEach(q => {
            assert.ok(quartiers.includes(q), `Le quartier "${q}" doit être présent`);
        });

        // Vérifier le tri décroissant
        for (let i = 0; i < data.length - 1; i++) {
            assert.ok(data[i].count >= data[i + 1].count,
                `Le tri doit être décroissant: ${data[i]._id}(${data[i].count}) >= ${data[i + 1]._id}(${data[i + 1].count})`);
        }

        // Vérifier que les counts sont des nombres raisonnables
        data.forEach(d => {
            assert.strictEqual(typeof d.count, 'number',
                `count doit être un nombre pour ${d._id}`);
            assert.ok(d.count > 100,
                `${d._id} doit avoir > 100 restaurants, reçu: ${d.count}`);
        });

        console.log(`   ✅ Top: ${data[0]._id} (${data[0].count})`);
    });
});

describe('API - Route /api/stats/top-cuisines', () => {

    it('doit retourner le top 10 des cuisines', async () => {
        const data = await fetchAPI('/api/stats/top-cuisines');

        // Vérifier la structure
        assert.ok(Array.isArray(data), 'Doit retourner un tableau');
        assert.ok(data.length > 0, 'Le tableau ne doit pas être vide');

        // Vérifier que ce n'est pas un TODO
        assertNotTodo(data[0]?.count, 'count de la première cuisine');
        assertNotTodo(data[0]?._id, '_id de la première cuisine');

        // Vérifier le nombre de cuisines
        assert.strictEqual(data.length, 10,
            `Doit avoir 10 cuisines (top 10), reçu: ${data.length}`);

        // Vérifier que American est #1 (c'est le cas dans sample_restaurants)
        assert.strictEqual(data[0]._id, 'American',
            `La cuisine #1 doit être "American", reçu: "${data[0]._id}"`);

        // Vérifier le tri décroissant
        for (let i = 0; i < data.length - 1; i++) {
            assert.ok(data[i].count >= data[i + 1].count,
                `Le tri doit être décroissant: ${data[i]._id}(${data[i].count}) >= ${data[i + 1]._id}(${data[i + 1].count})`);
        }

        // Vérifier que les counts sont des nombres
        data.forEach(d => {
            assert.strictEqual(typeof d.count, 'number',
                `count doit être un nombre pour ${d._id}`);
        });

        console.log(`   ✅ Top 3: ${data.slice(0, 3).map(d => d._id).join(', ')}`);
    });
});

describe('API - Route /api/stats/distribution-grades', () => {

    it('doit retourner la distribution des grades', async () => {
        const data = await fetchAPI('/api/stats/distribution-grades');

        // Vérifier la structure
        assert.ok(Array.isArray(data), 'Doit retourner un tableau');
        assert.ok(data.length > 0, 'Le tableau ne doit pas être vide');

        // Vérifier que ce n'est pas un TODO
        assertNotTodo(data[0]?.count, 'count du premier grade');
        assertNotTodo(data[0]?._id, '_id du premier grade');

        // Vérifier que les grades principaux sont présents
        const grades = data.map(d => d._id);
        assert.ok(grades.includes('A'),
            `Grade "A" doit être présent, grades trouvés: ${grades.join(', ')}`);
        assert.ok(grades.includes('B'),
            `Grade "B" doit être présent, grades trouvés: ${grades.join(', ')}`);
        assert.ok(grades.includes('C'),
            `Grade "C" doit être présent, grades trouvés: ${grades.join(', ')}`);

        // Vérifier que grade A a le plus d'occurrences (logique métier)
        const gradeA = data.find(d => d._id === 'A');
        assert.ok(gradeA, 'Grade A doit exister');
        assert.strictEqual(typeof gradeA.count, 'number',
            `count du grade A doit être un nombre, reçu: ${typeof gradeA.count}`);
        assert.ok(gradeA.count > 50000,
            `Grade A doit avoir > 50000 occurrences (c'est le plus fréquent), reçu: ${gradeA.count}`);

        // Vérifier que tous les counts sont des nombres
        data.forEach(d => {
            assert.strictEqual(typeof d.count, 'number',
                `count doit être un nombre pour grade ${d._id}`);
        });

        console.log(`   ✅ Grades: ${data.map(d => `${d._id}:${d.count}`).join(', ')}`);
    });
});

describe('API - Route /api/stats/evolution-scores', () => {

    it('doit retourner l\'évolution des scores par année', async () => {
        const data = await fetchAPI('/api/stats/evolution-scores');

        // Vérifier la structure
        assert.ok(Array.isArray(data), 'Doit retourner un tableau');
        assert.ok(data.length > 0, 'Le tableau ne doit pas être vide');

        // Vérifier que ce n'est pas un TODO
        assertNotTodo(data[0]?.avg_score, 'avg_score de la première année');
        assertNotTodo(data[0]?._id, '_id (année) du premier élément');

        // Vérifier le nombre d'années
        assert.ok(data.length >= 3,
            `Doit avoir au moins 3 années de données, reçu: ${data.length}`);

        // Vérifier chaque entrée
        data.forEach(d => {
            assert.strictEqual(typeof d._id, 'number',
                `L'année (_id) doit être un nombre, reçu: ${typeof d._id}`);
            assert.strictEqual(typeof d.avg_score, 'number',
                `avg_score doit être un nombre, reçu: ${typeof d.avg_score}`);
            assert.ok(d._id >= 2010 && d._id <= 2020,
                `Année ${d._id} doit être entre 2010 et 2020`);
            assert.ok(d.avg_score >= 0 && d.avg_score <= 30,
                `Score moyen ${d.avg_score} doit être entre 0 et 30`);
        });

        // Vérifier le tri par année croissante
        for (let i = 0; i < data.length - 1; i++) {
            assert.ok(data[i]._id <= data[i + 1]._id,
                `Le tri doit être par année croissante: ${data[i]._id} <= ${data[i + 1]._id}`);
        }

        console.log(`   ✅ ${data.length} années, scores de ${data[0].avg_score.toFixed(1)} à ${data[data.length - 1].avg_score.toFixed(1)}`);
    });
});

describe('API - Route BONUS /api/stats/dashboard', () => {

    it('doit retourner toutes les métriques avec $facet (BONUS)', async () => {
        const data = await fetchAPI('/api/stats/dashboard');

        // Cette route est un bonus - on vérifie si elle est implémentée
        if (data._info?.includes('non implémenté') || data.message?.includes('TODO')) {
            // Pour le bonus, on permet de skip mais avec un message clair
            assert.fail('Route bonus /api/stats/dashboard non implémentée - complétez le $facet pour valider ce test');
        }

        // Vérifier la présence de toutes les facettes
        assert.ok(data.overview, 'Doit contenir la facette "overview"');
        assert.ok(data.par_quartier, 'Doit contenir la facette "par_quartier"');
        assert.ok(data.top_cuisines, 'Doit contenir la facette "top_cuisines"');
        assert.ok(data.distribution_grades, 'Doit contenir la facette "distribution_grades"');
        assert.ok(data.evolution_scores, 'Doit contenir la facette "evolution_scores"');

        // Vérifier que les facettes contiennent des données
        assert.ok(Array.isArray(data.overview) && data.overview.length > 0,
            'overview doit être un tableau non vide');
        assert.ok(Array.isArray(data.par_quartier) && data.par_quartier.length > 0,
            'par_quartier doit être un tableau non vide');
        assert.ok(Array.isArray(data.top_cuisines) && data.top_cuisines.length > 0,
            'top_cuisines doit être un tableau non vide');

        console.log('   ✅ Toutes les facettes présentes avec données');
    });
});

// ============================================================================
// Résumé
// ============================================================================

describe('Résumé', () => {
    it('affiche le résumé des tests', () => {
        console.log('\n📊 Pour voir vos résultats en action, ouvrez dashboard-front/index.html\n');
    });
});
