// ============================================================================
// Dashboard API - SOLUTION COMPLÈTE
// TP2 MongoDB - BUT3 Informatique
// ============================================================================
// Ce fichier contient les pipelines d'agrégation complétés.
// À utiliser comme référence ou pour tester le front.
// ============================================================================

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Dashboard opérationnelle' });
});

// ============================================================================
// GET /api/stats/overview - SOLUTION
// ============================================================================
app.get('/api/stats/overview', async (req, res) => {
    try {
        const pipeline = [
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
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/par-quartier - SOLUTION
// ============================================================================
app.get('/api/stats/par-quartier', async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$borough",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/top-cuisines - SOLUTION
// ============================================================================
app.get('/api/stats/top-cuisines', async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$cuisine",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/distribution-grades - SOLUTION
// ============================================================================
app.get('/api/stats/distribution-grades', async (req, res) => {
    try {
        const pipeline = [
            { $unwind: "$grades" },
            {
                $group: {
                    _id: "$grades.grade",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/evolution-scores - SOLUTION
// ============================================================================
app.get('/api/stats/evolution-scores', async (req, res) => {
    try {
        const pipeline = [
            { $unwind: "$grades" },
            {
                $group: {
                    _id: { $year: "$grades.date" },
                    avg_score: { $avg: "$grades.score" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 1,
                    avg_score: { $round: ["$avg_score", 1] },
                    count: 1
                }
            },
            { $sort: { _id: 1 } },
            { $match: { _id: { $gte: 2010, $lte: 2015 } } }
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/stats/dashboard - SOLUTION avec $facet
// ============================================================================
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const pipeline = [
            {
                $facet: {
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
                    par_quartier: [
                        { $group: { _id: "$borough", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    top_cuisines: [
                        { $group: { _id: "$cuisine", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    distribution_grades: [
                        { $unwind: "$grades" },
                        { $group: { _id: "$grades.grade", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    evolution_scores: [
                        { $unwind: "$grades" },
                        {
                            $group: {
                                _id: { $year: "$grades.date" },
                                avg_score: { $avg: "$grades.score" }
                            }
                        },
                        { $project: { _id: 1, avg_score: { $round: ["$avg_score", 1] } } },
                        { $sort: { _id: 1 } },
                        { $match: { _id: { $gte: 2010, $lte: 2015 } } }
                    ]
                }
            }
        ];

        const result = await db.collection('restaurants').aggregate(pipeline).toArray();
        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Démarrage
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 API (SOLUTION) démarrée sur http://localhost:${PORT}`);
    });
});
