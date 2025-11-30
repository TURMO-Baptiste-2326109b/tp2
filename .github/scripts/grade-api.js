#!/usr/bin/env node

/**
 * Grade the dashboard-api/src/routes/stats.js file
 * Tests the MongoDB aggregation pipelines (static analysis)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract pipelines from stats.js file
 */
function extractPipelines(code) {
    const pipelines = {
        overview: null,
        parQuartier: null,
        topCuisines: null,
        distributionGrades: null,
        evolutionScores: null,
        dashboard: null
    };

    // Helper to extract pipeline array from code section
    function extractPipeline(section) {
        // Find the pipeline array
        const pipelineMatch = section.match(/const\s+pipeline\s*=\s*\[([\s\S]*?)\];/);
        if (!pipelineMatch) return null;

        const pipelineContent = pipelineMatch[1].trim();

        // Check if it's empty or just comments
        const cleanContent = pipelineContent
            .replace(/\/\/[^\n]*/g, '')  // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
            .trim();

        if (cleanContent.length < 5) return null;

        return pipelineContent;
    }

    // Split by route definitions
    const routes = {
        overview: /fastify\.get\s*\(\s*['"]\/api\/stats\/overview['"][\s\S]*?(?=fastify\.get|$)/,
        parQuartier: /fastify\.get\s*\(\s*['"]\/api\/stats\/par-quartier['"][\s\S]*?(?=fastify\.get|$)/,
        topCuisines: /fastify\.get\s*\(\s*['"]\/api\/stats\/top-cuisines['"][\s\S]*?(?=fastify\.get|$)/,
        distributionGrades: /fastify\.get\s*\(\s*['"]\/api\/stats\/distribution-grades['"][\s\S]*?(?=fastify\.get|$)/,
        evolutionScores: /fastify\.get\s*\(\s*['"]\/api\/stats\/evolution-scores['"][\s\S]*?(?=fastify\.get|$)/,
        dashboard: /fastify\.get\s*\(\s*['"]\/api\/stats\/dashboard['"][\s\S]*?(?=fastify\.get|$)/
    };

    for (const [name, regex] of Object.entries(routes)) {
        const match = code.match(regex);
        if (match) {
            pipelines[name] = extractPipeline(match[0]);
        }
    }

    return pipelines;
}

/**
 * Main grading function
 */
function gradeApi(filePath) {
    console.log('🔍 Grading API pipelines...\n');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return {
            pipelines: { score: 0, maxScore: 50, implemented: 0, total: 5, details: {} },
            error: 'File not found'
        };
    }

    const code = fs.readFileSync(filePath, 'utf8');

    // Extract pipelines
    console.log('📝 Extracting pipelines...');
    const pipelines = extractPipelines(code);

    const result = {
        pipelines: {
            score: 0,
            maxScore: 50,
            implemented: 0,
            total: 5,
            details: {
                overview: false,
                parQuartier: false,
                topCuisines: false,
                distributionGrades: false,
                evolutionScores: false,
                dashboard: false
            }
        }
    };

    // Check which pipelines are implemented (static analysis)
    const pipelinePoints = {
        overview: 10,
        parQuartier: 10,
        topCuisines: 10,
        distributionGrades: 10,
        evolutionScores: 10,
        dashboard: 0  // Bonus, no points
    };

    // Static analysis - check for key MongoDB operators
    const pipelinePatterns = {
        overview: ['$group', '$addToSet', '$size'],
        parQuartier: ['$group', 'borough', '$sort'],
        topCuisines: ['$group', 'cuisine', '$sort', '$limit'],
        distributionGrades: ['$unwind', 'grades', '$group'],
        evolutionScores: ['$unwind', '$year', '$avg'],
        dashboard: ['$facet']
    };

    console.log('\n📊 Pipeline analysis:');

    for (const [name, patterns] of Object.entries(pipelinePatterns)) {
        const pipelineCode = pipelines[name];
        const displayName = name.replace(/([A-Z])/g, '-$1').toLowerCase();

        if (pipelineCode) {
            // Check for required patterns
            const foundPatterns = patterns.filter(p =>
                pipelineCode.toLowerCase().includes(p.toLowerCase().replace('$', ''))
            );
            const isImplemented = foundPatterns.length >= Math.ceil(patterns.length * 0.5);

            result.pipelines.details[name] = isImplemented;

            if (isImplemented && name !== 'dashboard') {
                result.pipelines.implemented++;
                result.pipelines.score += pipelinePoints[name];
            }

            console.log(`   ${isImplemented ? '✅' : '⚠️'} ${displayName}: ${foundPatterns.length}/${patterns.length} patterns found`);
        } else {
            console.log(`   ❌ ${displayName}: not implemented`);
        }
    }

    // Save result - use script directory for consistent path
    const outputPath = path.join(__dirname, 'api-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ API grading complete`);
    console.log(`   Implemented: ${result.pipelines.implemented}/${result.pipelines.total}`);
    console.log(`   Score: ${result.pipelines.score}/${result.pipelines.maxScore}`);

    return result;
}

// Main execution
const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node grade-api.js <path-to-stats.js>');
    process.exit(1);
}

gradeApi(filePath);
