#!/usr/bin/env node

/**
 * Grade the playground-tp2.mongodb.js file
 * Analyzes structure and completed exercises
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Check if student info is filled in
 */
function analyzeStructure(code) {
    const result = {
        score: 0,
        maxScore: 5,
        details: []
    };

    // Check for student name
    const nameMatch = code.match(/Nom\s*:\s*([^\n_]+)/);
    const hasName = nameMatch && nameMatch[1].trim().length > 2 && !nameMatch[1].includes('___');
    result.details.push({
        check: 'Nom renseigné',
        passed: hasName,
        message: hasName ? 'OK' : 'Non renseigné'
    });
    if (hasName) result.score += 1;

    // Check for first name
    const prenomMatch = code.match(/Prénom\s*:\s*([^\n_]+)/);
    const hasPrenom = prenomMatch && prenomMatch[1].trim().length > 2 && !prenomMatch[1].includes('___');
    result.details.push({
        check: 'Prénom renseigné',
        passed: hasPrenom,
        message: hasPrenom ? 'OK' : 'Non renseigné'
    });
    if (hasPrenom) result.score += 1;

    // Check for group
    const groupMatch = code.match(/Groupe\s*:\s*([^\n_]+)/);
    const hasGroup = groupMatch && groupMatch[1].trim().length > 0 && !groupMatch[1].includes('___');
    result.details.push({
        check: 'Groupe renseigné',
        passed: hasGroup,
        message: hasGroup ? 'OK' : 'Non renseigné'
    });
    if (hasGroup) result.score += 1;

    // Check for date
    const dateMatch = code.match(/Date\s*:\s*([^\n_]+)/);
    const hasDate = dateMatch && dateMatch[1].trim().length > 0 && !dateMatch[1].includes('___');
    result.details.push({
        check: 'Date renseignée',
        passed: hasDate,
        message: hasDate ? 'OK' : 'Non renseignée'
    });
    if (hasDate) result.score += 1;

    // Check for checklist usage
    const checklistUsed = (code.match(/\[x\]/gi) || []).length;
    const hasChecklist = checklistUsed >= 3;
    result.details.push({
        check: 'Checklist utilisée',
        passed: hasChecklist,
        message: hasChecklist ? `${checklistUsed} éléments cochés` : 'Aucun élément coché'
    });
    if (hasChecklist) result.score += 1;

    return result;
}

/**
 * Analyze which exercises are completed
 */
function analyzeExercises(code) {
    const result = {
        score: 0,
        maxScore: 35,
        completed: 0,
        total: 16,
        details: []
    };

    // Define exercise patterns to detect completion
    const exercises = [
        { num: 1, name: '$elemMatch simple', patterns: ['$elemMatch', 'grade.*score'] },
        { num: 2, name: '$elemMatch avec dates', patterns: ['$elemMatch', 'date', '$gte'] },
        { num: 3, name: '$elemMatch avec $or', patterns: ['$elemMatch', '$or'] },
        { num: 4, name: '$expr avec $size', patterns: ['$expr', '$size', 'grades'] },
        { num: 5, name: 'Comparaison éléments', patterns: ['$expr', '$arrayElemAt'] },
        { num: 6, name: 'Validation données', patterns: ['$exists', '$type'] },
        { num: 7, name: 'Comptage par quartier', patterns: ['$group', 'borough', '$sum'] },
        { num: 8, name: 'Top cuisines Manhattan', patterns: ['$match', 'Manhattan', '$group', '$sort', '$limit'] },
        { num: 9, name: 'Cuisines par quartier', patterns: ['$group', '$addToSet'] },
        { num: 10, name: 'Score moyen par année', patterns: ['$unwind', '$year', '$avg'] },
        { num: 11, name: 'Inspections par quartier', patterns: ['$unwind', '$group', 'grades'] },
        { num: 12, name: 'Jointure $lookup', patterns: ['$lookup', 'boroughs'] },
        { num: 13, name: 'Histogramme $bucket', patterns: ['$bucket'] },
        { num: 14, name: 'Dashboard $facet', patterns: ['$facet'] },
        { num: 15, name: 'Index composé', patterns: ['createIndex', 'borough', 'cuisine'] },
        { num: 16, name: 'Index géospatial', patterns: ['2dsphere', '$nearSphere'] }
    ];

    // Split code by exercise sections
    const exerciseSections = code.split(/\/\/\s*={10,}/);

    exercises.forEach(ex => {
        // Find the section for this exercise
        const sectionRegex = new RegExp(`Exercice\\s*${ex.num}[^=]*`, 'i');
        let exerciseCode = '';

        for (let i = 0; i < exerciseSections.length; i++) {
            if (sectionRegex.test(exerciseSections[i])) {
                // Get this section and possibly the next one (for the actual code)
                exerciseCode = exerciseSections[i] + (exerciseSections[i + 1] || '');
                break;
            }
        }

        // Check if TODO is still present (not completed)
        const hasTodo = /\/\/\s*TODO/.test(exerciseCode);

        // Check if patterns are present
        const patternsFound = ex.patterns.filter(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(exerciseCode);
        });

        const isCompleted = !hasTodo && patternsFound.length >= Math.ceil(ex.patterns.length * 0.6);

        result.details.push({
            exercise: ex.num,
            name: ex.name,
            completed: isCompleted,
            patternsFound: patternsFound.length,
            patternsExpected: ex.patterns.length
        });

        if (isCompleted) {
            result.completed++;
            // Points based on exercise phase
            if (ex.num <= 6) result.score += 2;        // Phase 1: 2 pts each
            else if (ex.num <= 11) result.score += 2.5; // Phase 2-3: 2.5 pts each
            else result.score += 2;                     // Phase 4-5: 2 pts each
        }
    });

    // Round score
    result.score = Math.round(result.score * 10) / 10;

    return result;
}

/**
 * Main grading function
 */
function gradePlayground(filePath) {
    console.log('📋 Grading playground file...\n');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return {
            structure: { score: 0, maxScore: 5, details: [] },
            exercises: { score: 0, maxScore: 35, completed: 0, total: 16, details: [] },
            error: 'File not found'
        };
    }

    const code = fs.readFileSync(filePath, 'utf8');

    // Analyze structure
    console.log('📝 Analyzing structure...');
    const structure = analyzeStructure(code);
    console.log(`   Score: ${structure.score}/${structure.maxScore}`);
    structure.details.forEach(d => {
        console.log(`   ${d.passed ? '✅' : '❌'} ${d.check}: ${d.message}`);
    });

    // Analyze exercises
    console.log('\n📊 Analyzing exercises...');
    const exercises = analyzeExercises(code);
    console.log(`   Completed: ${exercises.completed}/${exercises.total}`);
    console.log(`   Score: ${exercises.score}/${exercises.maxScore}`);

    // Show exercise details
    console.log('\n   Exercise details:');
    exercises.details.forEach(d => {
        console.log(`   ${d.completed ? '✅' : '❌'} Ex ${d.exercise}: ${d.name}`);
    });

    const result = { structure, exercises };

    // Save result - use script directory for consistent path
    const outputPath = path.join(__dirname, 'playground-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ Playground grading complete`);
    console.log(`   Total: ${structure.score + exercises.score}/${structure.maxScore + exercises.maxScore}`);

    return result;
}

// Main execution
const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node grade-playground.js <path-to-playground-file>');
    process.exit(1);
}

gradePlayground(filePath);
