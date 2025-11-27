// ============================================================================
// Dashboard API - TP2 MongoDB
// API REST pour exposer les métriques du dashboard restaurants
// ============================================================================

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------------
// Connexion MongoDB
// ----------------------------------------------------------------------------
let db;

async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db('sample_restaurants');
        console.log('✅ Connecté à MongoDB Atlas');
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        process.exit(1);
    }
}

// ----------------------------------------------------------------------------
// Routes API
// ----------------------------------------------------------------------------

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Dashboard opérationnelle' });
});

// ============================================================================
// GET /api/stats/overview
// Retourne les statistiques générales
// - Nombre total de restaurants
// - Nombre de types de cuisine différents
// ============================================================================
app.get('/api/stats/overview', async (req, res) => {
    try {
        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : { total_restaurants, total_cuisines }
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        // Si le pipeline est vide, renvoyer des données fictives pour tester le front
        if (pipeline.length === 0) {
            return res.json({
                total_restaurants: "TODO",
                total_cuisines: "TODO",
                _info: "Pipeline non implémenté - complétez le TODO dans server.js"
            });
        }

        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/par-quartier
// Retourne le nombre de restaurants par quartier
// ============================================================================
app.get('/api/stats/par-quartier', async (req, res) => {
    try {
        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: "Manhattan", count: 10259 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return res.json([
                { _id: "Manhattan", count: "TODO" },
                { _id: "Brooklyn", count: "TODO" },
                { _id: "Queens", count: "TODO" },
                { _id: "Bronx", count: "TODO" },
                { _id: "Staten Island", count: "TODO" }
            ]);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/top-cuisines
// Retourne le top 10 des cuisines les plus représentées
// ============================================================================
app.get('/api/stats/top-cuisines', async (req, res) => {
    try {
        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: "American", count: 6183 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return res.json([
                { _id: "American", count: "TODO" },
                { _id: "Chinese", count: "TODO" },
                { _id: "Italian", count: "TODO" }
            ]);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/distribution-grades
// Retourne la distribution des grades (A, B, C, etc.)
// ============================================================================
app.get('/api/stats/distribution-grades', async (req, res) => {
    try {
        // TODO: Compléter le pipeline d'agrégation
        // Attention: il faut $unwind les grades d'abord !
        // Le pipeline doit retourner : [{ _id: "A", count: 80234 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return res.json([
                { _id: "A", count: "TODO" },
                { _id: "B", count: "TODO" },
                { _id: "C", count: "TODO" }
            ]);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/evolution-scores
// Retourne l'évolution du score moyen par année
// ============================================================================
app.get('/api/stats/evolution-scores', async (req, res) => {
    try {
        // TODO: Compléter le pipeline d'agrégation
        // Le pipeline doit retourner : [{ _id: 2012, avg_score: 10.5 }, ...]
        const pipeline = [
            // Votre pipeline ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return res.json([
                { _id: 2012, avg_score: "TODO" },
                { _id: 2013, avg_score: "TODO" },
                { _id: 2014, avg_score: "TODO" }
            ]);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/dashboard
// Route bonus : retourne TOUTES les métriques en un seul appel avec $facet
// ============================================================================
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        // TODO (BONUS): Utiliser $facet pour tout récupérer en une seule requête
        const pipeline = [
            // Votre pipeline $facet ici...
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();

        if (pipeline.length === 0) {
            return res.json({
                overview: [{ total_restaurants: "TODO", total_cuisines: "TODO" }],
                par_quartier: [],
                top_cuisines: [],
                distribution_grades: [],
                evolution_scores: [],
                _info: "Pipeline $facet non implémenté"
            });
        }

        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------------------------------------------------------------
// Démarrage du serveur
// ----------------------------------------------------------------------------
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 API démarrée sur http://localhost:${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/api/stats/dashboard`);
        console.log('\nRoutes disponibles:');
        console.log('  GET /api/health');
        console.log('  GET /api/stats/overview');
        console.log('  GET /api/stats/par-quartier');
        console.log('  GET /api/stats/top-cuisines');
        console.log('  GET /api/stats/distribution-grades');
        console.log('  GET /api/stats/evolution-scores');
        console.log('  GET /api/stats/dashboard (bonus)');
    });
});
