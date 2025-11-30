// ============================================================================
// Routes des statistiques - TP2 MongoDB
// ============================================================================

const { getDB } = require('../config/database');

function statsRoutes(fastify) {

    // ========================================================================
    // GET /api/stats/overview
    // Retourne les statistiques générales
    // ========================================================================
    fastify.get('/api/stats/overview', async () => {
        const db = getDB();

        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : { total_restaurants, total_cuisines }
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return {
                total_restaurants: "TODO",
                total_cuisines: "TODO",
                _info: "Pipeline non implémenté - complétez le TODO dans src/routes/stats.js"
            };
        }

        return result[0] || {};
    });

    // ========================================================================
    // GET /api/stats/par-quartier
    // Retourne le nombre de restaurants par quartier
    // ========================================================================
    fastify.get('/api/stats/par-quartier', async () => {
        const db = getDB();

        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: "Manhattan", count: 10259 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return [
                { _id: "Manhattan", count: "TODO" },
                { _id: "Brooklyn", count: "TODO" },
                { _id: "Queens", count: "TODO" },
                { _id: "Bronx", count: "TODO" },
                { _id: "Staten Island", count: "TODO" }
            ];
        }

        return result;
    });

    // ========================================================================
    // GET /api/stats/top-cuisines
    // Retourne le top 10 des cuisines les plus représentées
    // ========================================================================
    fastify.get('/api/stats/top-cuisines', async () => {
        const db = getDB();

        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: "American", count: 6183 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return [
                { _id: "American", count: "TODO" },
                { _id: "Chinese", count: "TODO" },
                { _id: "Italian", count: "TODO" }
            ];
        }

        return result;
    });

    // ========================================================================
    // GET /api/stats/distribution-grades
    // Retourne la distribution des grades (A, B, C, etc.)
    // ========================================================================
    fastify.get('/api/stats/distribution-grades', async () => {
        const db = getDB();

        // TODO: Compléter le pipeline d'agrégation
        // Attention: il faut $unwind les grades d'abord !
        // Le pipeline doit retourner : [{ _id: "A", count: 80234 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return [
                { _id: "A", count: "TODO" },
                { _id: "B", count: "TODO" },
                { _id: "C", count: "TODO" }
            ];
        }

        return result;
    });

    // ========================================================================
    // GET /api/stats/evolution-scores
    // Retourne l'évolution du score moyen par année
    // ========================================================================
    fastify.get('/api/stats/evolution-scores', async () => {
        const db = getDB();

        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: 2012, avg_score: 10.5 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return [
                { _id: 2012, avg_score: "TODO" },
                { _id: 2013, avg_score: "TODO" },
                { _id: 2014, avg_score: "TODO" }
            ];
        }

        return result;
    });

    // ========================================================================
    // GET /api/stats/dashboard
    // Route bonus : retourne TOUTES les métriques en un seul appel avec $facet
    // ========================================================================
    fastify.get('/api/stats/dashboard', async () => {
        const db = getDB();

        // TODO (BONUS): Utiliser $facet pour tout récupérer en une seule requête
        const pipeline = [
            // Votre pipeline $facet ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return {
                overview: [{ total_restaurants: "TODO", total_cuisines: "TODO" }],
                par_quartier: [],
                top_cuisines: [],
                distribution_grades: [],
                evolution_scores: [],
                _info: "Pipeline $facet non implémenté"
            };
        }

        return result[0] || {};
    });
}

module.exports = statsRoutes;
