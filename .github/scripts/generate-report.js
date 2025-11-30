#!/usr/bin/env node

/**
 * Generate final grade report
 * Combines playground and API grades into a single report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse test output to extract test results
 */
function parseTestOutput() {
    const testOutputPath = path.join(__dirname, '../../dashboard-api/test-output.txt');

    const result = {
        passed: 0,
        failed: 0,
        total: 0,
        score: 0,
        maxScore: 10
    };

    if (!fs.existsSync(testOutputPath)) {
        console.log('⚠️ No test output found');
        return result;
    }

    const output = fs.readFileSync(testOutputPath, 'utf8');

    // Parse vitest output format: "Tests  5 passed (5)"
    const passedMatch = output.match(/Tests?\s+(\d+)\s+passed/i);
    const failedMatch = output.match(/Tests?\s+(\d+)\s+failed/i);

    if (passedMatch) {
        result.passed = parseInt(passedMatch[1], 10);
    }
    if (failedMatch) {
        result.failed = parseInt(failedMatch[1], 10);
    }

    result.total = result.passed + result.failed;

    // Calculate score: 10 points for tests, proportional to passed
    if (result.total > 0) {
        result.score = Math.round((result.passed / result.total) * result.maxScore);
    }

    return result;
}

/**
 * Main report generation
 */
function generateReport() {
    console.log('📊 Generating final grade report...\n');

    const report = {
        timestamp: new Date().toISOString(),
        totalScore: 0,
        maxScore: 100,
        playground: {
            structure: { score: 0, maxScore: 5 },
            exercises: { score: 0, maxScore: 35, completed: 0, total: 16 }
        },
        api: {
            pipelines: { score: 0, maxScore: 50, implemented: 0, total: 5, details: {} }
        },
        tests: { passed: 0, failed: 0, total: 0, score: 0, maxScore: 10 },
        feedback: []
    };

    // Load playground report
    const playgroundReportPath = path.join(__dirname, 'playground-report.json');
    if (fs.existsSync(playgroundReportPath)) {
        try {
            const playgroundData = JSON.parse(fs.readFileSync(playgroundReportPath, 'utf8'));
            report.playground.structure = playgroundData.structure || report.playground.structure;
            report.playground.exercises = playgroundData.exercises || report.playground.exercises;
            console.log('✅ Loaded playground report');
        } catch (e) {
            console.log('⚠️ Could not parse playground report:', e.message);
            report.feedback.push('Erreur lors de l\'analyse du playground');
        }
    } else {
        console.log('⚠️ Playground report not found');
        report.feedback.push('Fichier playground-tp2.mongodb.js non trouvé ou non analysable');
    }

    // Load API report
    const apiReportPath = path.join(__dirname, 'api-report.json');
    if (fs.existsSync(apiReportPath)) {
        try {
            const apiData = JSON.parse(fs.readFileSync(apiReportPath, 'utf8'));
            report.api.pipelines = apiData.pipelines || report.api.pipelines;
            console.log('✅ Loaded API report');
        } catch (e) {
            console.log('⚠️ Could not parse API report:', e.message);
            report.feedback.push('Erreur lors de l\'analyse des pipelines API');
        }
    } else {
        console.log('⚠️ API report not found');
        report.feedback.push('Fichier stats.js non trouvé ou non analysable');
    }

    // Parse test results
    report.tests = parseTestOutput();
    if (report.tests.total > 0) {
        console.log(`✅ Parsed test results: ${report.tests.passed}/${report.tests.total} passed`);
    }

    // Calculate total score
    report.totalScore =
        report.playground.structure.score +
        report.playground.exercises.score +
        report.api.pipelines.score +
        report.tests.score;

    // Generate feedback
    if (report.playground.structure.score === 0) {
        report.feedback.push('💡 N\'oubliez pas de remplir vos informations étudiant dans le playground');
    }

    if (report.playground.exercises.completed < 8) {
        report.feedback.push('💡 Essayez de compléter plus d\'exercices dans le playground');
    }

    if (report.api.pipelines.implemented < 3) {
        report.feedback.push('💡 Implémentez plus de pipelines d\'agrégation dans stats.js');
    }

    if (report.tests.failed > 0) {
        report.feedback.push(`💡 ${report.tests.failed} test(s) en échec - vérifiez vos implémentations`);
    }

    if (report.totalScore >= 80) {
        report.feedback.push('🎉 Excellent travail !');
    } else if (report.totalScore >= 60) {
        report.feedback.push('👍 Bon travail, continuez ainsi !');
    } else if (report.totalScore >= 40) {
        report.feedback.push('⚠️ Des améliorations sont nécessaires');
    } else {
        report.feedback.push('❌ Travail insuffisant - consultez les consignes du TP');
    }

    // Save report
    const outputPath = path.join(__dirname, 'grade-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE L\'ÉVALUATION');
    console.log('='.repeat(50));
    console.log(`\n📝 Playground MongoDB:`);
    console.log(`   Structure: ${report.playground.structure.score}/${report.playground.structure.maxScore}`);
    console.log(`   Exercices: ${report.playground.exercises.score}/${report.playground.exercises.maxScore} (${report.playground.exercises.completed}/${report.playground.exercises.total} complétés)`);

    console.log(`\n🔧 API Dashboard:`);
    console.log(`   Pipelines: ${report.api.pipelines.score}/${report.api.pipelines.maxScore} (${report.api.pipelines.implemented}/${report.api.pipelines.total} implémentés)`);

    console.log(`\n🧪 Tests:`);
    console.log(`   Résultat: ${report.tests.passed}/${report.tests.total} passés`);
    console.log(`   Score: ${report.tests.score}/${report.tests.maxScore}`);

    console.log('\n' + '='.repeat(50));
    console.log(`📊 NOTE TOTALE: ${report.totalScore}/${report.maxScore}`);
    console.log('='.repeat(50));

    console.log('\n💬 Feedback:');
    report.feedback.forEach(fb => console.log(`   ${fb}`));

    console.log(`\n✅ Report saved to: ${outputPath}`);

    return report;
}

// Run
generateReport();
