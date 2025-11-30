#!/usr/bin/env node

/**
 * Load test data for TP2 grading
 * Creates a minimal sample_restaurants dataset for testing pipelines
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'sample_restaurants';

// Sample restaurant data for testing
const sampleRestaurants = [
    // Manhattan restaurants
    ...Array.from({ length: 50 }, (_, i) => ({
        name: `Manhattan Restaurant ${i + 1}`,
        borough: 'Manhattan',
        cuisine: ['American', 'Italian', 'Chinese', 'French', 'Japanese'][i % 5],
        address: {
            building: `${100 + i}`,
            street: 'Test Street',
            zipcode: '10001',
            coord: [-73.99 + (i * 0.001), 40.75 + (i * 0.001)]
        },
        grades: [
            { date: new Date('2014-03-03'), grade: 'A', score: 2 + (i % 10) },
            { date: new Date('2013-09-11'), grade: ['A', 'B', 'C'][i % 3], score: 5 + (i % 15) },
            { date: new Date('2012-05-20'), grade: 'A', score: 3 + (i % 8) }
        ],
        restaurant_id: `manhattan_${i + 1}`
    })),
    // Brooklyn restaurants
    ...Array.from({ length: 40 }, (_, i) => ({
        name: `Brooklyn Restaurant ${i + 1}`,
        borough: 'Brooklyn',
        cuisine: ['American', 'Pizza', 'Caribbean', 'Italian', 'Mexican'][i % 5],
        address: {
            building: `${200 + i}`,
            street: 'Brooklyn Ave',
            zipcode: '11201',
            coord: [-73.98 + (i * 0.001), 40.69 + (i * 0.001)]
        },
        grades: [
            { date: new Date('2014-06-15'), grade: ['A', 'B'][i % 2], score: 4 + (i % 12) },
            { date: new Date('2013-02-22'), grade: 'A', score: 6 + (i % 10) }
        ],
        restaurant_id: `brooklyn_${i + 1}`
    })),
    // Queens restaurants
    ...Array.from({ length: 35 }, (_, i) => ({
        name: `Queens Restaurant ${i + 1}`,
        borough: 'Queens',
        cuisine: ['Chinese', 'Korean', 'Indian', 'Greek', 'Thai'][i % 5],
        address: {
            building: `${300 + i}`,
            street: 'Queens Blvd',
            zipcode: '11375',
            coord: [-73.85 + (i * 0.001), 40.72 + (i * 0.001)]
        },
        grades: [
            { date: new Date('2014-01-10'), grade: 'A', score: 3 + (i % 9) },
            { date: new Date('2012-11-05'), grade: ['A', 'B', 'C'][i % 3], score: 7 + (i % 11) }
        ],
        restaurant_id: `queens_${i + 1}`
    })),
    // Bronx restaurants
    ...Array.from({ length: 25 }, (_, i) => ({
        name: `Bronx Restaurant ${i + 1}`,
        borough: 'Bronx',
        cuisine: ['American', 'Latin American', 'Italian', 'Soul Food', 'Dominican'][i % 5],
        address: {
            building: `${400 + i}`,
            street: 'Grand Concourse',
            zipcode: '10451',
            coord: [-73.92 + (i * 0.001), 40.82 + (i * 0.001)]
        },
        grades: [
            { date: new Date('2013-08-20'), grade: ['A', 'B'][i % 2], score: 5 + (i % 13) },
            { date: new Date('2012-04-15'), grade: 'B', score: 10 + (i % 8) }
        ],
        restaurant_id: `bronx_${i + 1}`
    })),
    // Staten Island restaurants
    ...Array.from({ length: 15 }, (_, i) => ({
        name: `Staten Island Restaurant ${i + 1}`,
        borough: 'Staten Island',
        cuisine: ['American', 'Italian', 'Seafood', 'Diner', 'Pizza'][i % 5],
        address: {
            building: `${500 + i}`,
            street: 'Victory Blvd',
            zipcode: '10301',
            coord: [-74.09 + (i * 0.001), 40.64 + (i * 0.001)]
        },
        grades: [
            { date: new Date('2014-02-28'), grade: 'A', score: 2 + (i % 7) },
            { date: new Date('2013-05-10'), grade: 'A', score: 4 + (i % 6) }
        ],
        restaurant_id: `staten_island_${i + 1}`
    }))
];

// Borough data for $lookup tests
const boroughs = [
    { _id: 'Manhattan', population: 1628706, area_km2: 59.1 },
    { _id: 'Brooklyn', population: 2559903, area_km2: 183.4 },
    { _id: 'Queens', population: 2253858, area_km2: 283.0 },
    { _id: 'Bronx', population: 1418207, area_km2: 109.0 },
    { _id: 'Staten Island', population: 476143, area_km2: 151.1 }
];

async function loadTestData() {
    console.log('🗄️  Loading test data for TP2 grading...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);

        // Drop existing collections
        try {
            await db.collection('restaurants').drop();
            console.log('   Dropped existing restaurants collection');
        } catch (e) {
            // Collection doesn't exist, that's fine
        }

        try {
            await db.collection('boroughs').drop();
            console.log('   Dropped existing boroughs collection');
        } catch (e) {
            // Collection doesn't exist, that's fine
        }

        // Insert restaurants
        const restaurantResult = await db.collection('restaurants').insertMany(sampleRestaurants);
        console.log(`✅ Inserted ${restaurantResult.insertedCount} restaurants`);

        // Insert boroughs
        const boroughResult = await db.collection('boroughs').insertMany(boroughs);
        console.log(`✅ Inserted ${boroughResult.insertedCount} boroughs`);

        // Create indexes
        await db.collection('restaurants').createIndex({ borough: 1 });
        await db.collection('restaurants').createIndex({ cuisine: 1 });
        await db.collection('restaurants').createIndex({ 'address.coord': '2dsphere' });
        console.log('✅ Created indexes');

        // Verify data
        const count = await db.collection('restaurants').countDocuments();
        console.log(`\n📊 Total restaurants in database: ${count}`);

        // Show distribution by borough
        const byBorough = await db.collection('restaurants').aggregate([
            { $group: { _id: '$borough', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        console.log('\n📍 Distribution by borough:');
        byBorough.forEach(b => console.log(`   ${b._id}: ${b.count}`));

        console.log('\n✅ Test data loaded successfully!');

    } finally {
        await client.close();
        console.log('✅ Disconnected from MongoDB\n');
    }
}

loadTestData().catch(console.error);
