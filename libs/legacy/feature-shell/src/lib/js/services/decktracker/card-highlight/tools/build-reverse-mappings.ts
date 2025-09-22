#!/usr/bin/env node
/**
 * Build-time script to analyze existing selectors and generate reverse mappings
 * Run this during development to update reverse selector mappings
 *
 * Usage: ts-node build-reverse-mappings.ts
 *
 * This script analyzes card-id-selectors.ts to find common patterns and automatically
 * generates reverse selector code that gets injected into the main selector files.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ReverseMappings {
	// Race -> [cards that want this race]
	races: { [race: string]: string[] };
	// Spell school -> [cards that want this spell school]
	spellSchools: { [school: string]: string[] };
	// Card type -> [cards that want this card type]
	cardTypes: { [type: string]: string[] };
	// Mechanic -> [cards that want this mechanic]
	mechanics: { [mechanic: string]: string[] };
	// Compound conditions -> [cards that want this combination]
	compounds: { [key: string]: { cards: string[]; condition: string } };
}

// Selector hierarchy - from most generic to most specific
const SELECTOR_HIERARCHY = {
	// Generic selectors to ignore
	generic: [
		'side',
		'inputSide',
		'inDeck',
		'inHand',
		'inGraveyard',
		'inPlay',
		'inOther',
		'inStartingHand',
		'inInitialDeck',
		'or',
		'and',
	],

	// Card types (generic)
	cardTypes: ['minion', 'spell', 'weapon', 'location'],

	// Tribes (specific characterizations of minions)
	tribes: ['beast', 'dragon', 'murloc', 'pirate', 'mech', 'demon', 'elemental', 'undead', 'naga', 'totem'],

	// Spell schools (specific characterizations of spells)
	spellSchools: ['arcane', 'fire', 'frost', 'nature', 'holy', 'shadow', 'fel'],

	// Mechanics (can apply to various card types)
	mechanics: [
		'deathrattle',
		'battlecry',
		'secret',
		'taunt',
		'rush',
		'charge',
		'windfury',
		'divineShield',
		'lifesteal',
		'reborn',
		'magnetic',
		'discover',
		'overload',
		'combo',
		'outcast',
		'frenzy',
		'corrupt',
		'corrupted',
		'infuse',
		'forge',
		'excavate',
		'quickdraw',
		'tradeable',
		'legendary',
		'chooseOne',
	],

	// Filters (most specific)
	filters: [
		'effectiveCostEqual',
		'effectiveCostMore',
		'effectiveCostLess',
		'baseCostEqual',
		'baseCostMore',
		'baseCostLess',
		'attackGreaterThan',
		'attackLessThan',
		'attackIs',
		'healthLessThan',
		'healthIs',
		'healthBiggerThanAttack',
		'not',
		'tribeless',
		'neutral',
		'fromAnotherClass',
		'notInInitialDeck',
		'hasMultipleCopies',
		'costMore',
		'costLess',
		'currentClass',
	],
};

interface ParsedSelector {
	cardType?: string;
	tribe?: string;
	spellSchool?: string;
	mechanics: string[];
	filters: string[];
	conditions: string;
	// For compound conditions
	isCompound: boolean;
	compoundKey?: string;
}

function parseSelector(selectorCode: string): ParsedSelector {
	const result: ParsedSelector = {
		mechanics: [],
		filters: [],
		conditions: selectorCode,
		isCompound: false,
	};

	// Skip complex selectors
	if (
		selectorCode.includes('highlightConditions') ||
		selectorCode.includes('input: SelectorInput') ||
		selectorCode.includes('tooltip') ||
		selectorCode.includes('cardIs(') ||
		selectorCode.includes('entityIs(') ||
		selectorCode.length > 500
	) {
		return result;
	}

	// Find card type (most generic)
	for (const cardType of SELECTOR_HIERARCHY.cardTypes) {
		if (new RegExp(`\\b${cardType}\\b`, 'i').test(selectorCode)) {
			result.cardType = cardType;
			break; // Take the first match
		}
	}

	// Find tribe (specific characterization)
	for (const tribe of SELECTOR_HIERARCHY.tribes) {
		if (new RegExp(`\\b${tribe}\\b`, 'i').test(selectorCode)) {
			result.tribe = tribe;
			break; // Take the first match
		}
	}

	// Find spell school (specific characterization)
	for (const spellSchool of SELECTOR_HIERARCHY.spellSchools) {
		if (new RegExp(`\\b${spellSchool}\\b`, 'i').test(selectorCode)) {
			result.spellSchool = spellSchool;
			break; // Take the first match
		}
	}

	// Find mechanics
	for (const mechanic of SELECTOR_HIERARCHY.mechanics) {
		if (new RegExp(`\\b${mechanic}\\b`, 'i').test(selectorCode)) {
			result.mechanics.push(mechanic);
		}
	}

	// Find filters
	for (const filter of SELECTOR_HIERARCHY.filters) {
		if (new RegExp(`\\b${filter}\\b`, 'i').test(selectorCode)) {
			result.filters.push(filter);
		}
	}

	// Determine if this is a compound condition and build a key
	const hasMultipleSpecificSelectors =
		(result.tribe ? 1 : 0) + (result.spellSchool ? 1 : 0) + result.mechanics.length > 1;

	if (hasMultipleSpecificSelectors) {
		result.isCompound = true;
		// Build a compound key from the most specific selectors
		const keyParts: string[] = [];
		if (result.tribe) keyParts.push(result.tribe);
		if (result.spellSchool) keyParts.push(result.spellSchool);
		keyParts.push(...result.mechanics.sort());
		result.compoundKey = keyParts.join('+');
	}

	return result;
}

function buildReverseCondition(parsed: ParsedSelector): string | null {
	// Skip if there are complex filters
	if (parsed.filters.length > 0) {
		return null;
	}

	const conditions: string[] = [];

	// Handle compound conditions first
	if (parsed.isCompound) {
		// Build compound condition
		if (parsed.tribe) {
			conditions.push(`refCard.races?.map(r => r.toUpperCase()).includes('${parsed.tribe.toUpperCase()}')`);
		}
		if (parsed.spellSchool) {
			conditions.push(`refCard.spellSchool?.toUpperCase() === '${parsed.spellSchool.toUpperCase()}'`);
			// Ensure it's a spell if we have a spell school
			if (!parsed.cardType || parsed.cardType !== 'spell') {
				conditions.push(`refCard.type?.toUpperCase() === 'SPELL'`);
			}
		}
		// For now, skip mechanics in compound conditions as they're complex to reverse-engineer
		// TODO: Add mechanic conditions when we have a way to check them

		return conditions.length > 0 ? conditions.join(' && ') : null;
	}

	// Handle simple conditions
	if (parsed.spellSchool) {
		let condition = `refCard.spellSchool?.toUpperCase() === '${parsed.spellSchool.toUpperCase()}'`;
		// Add spell type requirement if not already specified
		if (!parsed.cardType || parsed.cardType !== 'spell') {
			condition = `refCard.type?.toUpperCase() === 'SPELL' && ${condition}`;
		}
		return condition;
	} else if (parsed.tribe) {
		return `refCard.races?.map(r => r.toUpperCase()).includes('${parsed.tribe.toUpperCase()}')`;
	} else if (parsed.mechanics.length === 1) {
		// For now, skip single mechanics as they're complex to reverse-engineer
		// TODO: Add mechanic conditions when we have a way to check them
		return null;
	} else if (parsed.cardType && parsed.mechanics.length === 0) {
		// Only use generic card types if there are no mechanics or filters
		return `refCard.type?.toUpperCase() === '${parsed.cardType.toUpperCase()}'`;
	} else {
		// Too generic or has complex conditions
		return null;
	}
}

function extractCardSelectors(): { [cardId: string]: string } {
	const selectorsFilePath = path.join(__dirname, '..', 'card-id-selectors.ts');
	const content = fs.readFileSync(selectorsFilePath, 'utf8');

	const selectors: { [cardId: string]: string } = {};

	// Extract all case statements
	const casePattern = /case CardIds\.([^:]+):\s*([\s\S]*?)(?=case CardIds\.|default:|^\t})/gm;
	let match;

	while ((match = casePattern.exec(content)) !== null) {
		const cardIdSuffix = match[1];
		const selectorCode = match[2].trim();

		// Clean up the selector code
		const cleanCode = selectorCode
			.replace(/^\s*\/\/.*$/gm, '') // Remove comments
			.replace(/\n\s*\n/g, '\n') // Remove empty lines
			.trim();

		if (cleanCode && cleanCode !== 'break;') {
			selectors[cardIdSuffix] = cleanCode;
		}
	}

	return selectors;
}

function buildReverseMappings(): ReverseMappings {
	const mappings: ReverseMappings = {
		races: {},
		spellSchools: {},
		cardTypes: {},
		mechanics: {},
		compounds: {},
	};

	const selectors = extractCardSelectors();
	console.log(`Found ${Object.keys(selectors).length} card selectors to analyze`);

	for (const [cardIdSuffix, selectorCode] of Object.entries(selectors)) {
		const parsed = parseSelector(selectorCode);

		// Skip if we can't build a reverse condition
		const reverseCondition = buildReverseCondition(parsed);
		if (!reverseCondition) {
			continue;
		}

		// Categorize by the most specific selector
		if (parsed.isCompound && parsed.compoundKey) {
			// Handle compound conditions
			if (!mappings.compounds[parsed.compoundKey]) {
				mappings.compounds[parsed.compoundKey] = {
					cards: [],
					condition: reverseCondition,
				};
			}
			mappings.compounds[parsed.compoundKey].cards.push(cardIdSuffix);
		} else if (parsed.spellSchool) {
			if (!mappings.spellSchools[parsed.spellSchool]) {
				mappings.spellSchools[parsed.spellSchool] = [];
			}
			mappings.spellSchools[parsed.spellSchool].push(cardIdSuffix);
		} else if (parsed.tribe) {
			if (!mappings.races[parsed.tribe]) {
				mappings.races[parsed.tribe] = [];
			}
			mappings.races[parsed.tribe].push(cardIdSuffix);
		} else if (parsed.cardType && parsed.filters.length === 0 && parsed.mechanics.length === 0) {
			// Only include card types without filters or mechanics
			if (!mappings.cardTypes[parsed.cardType]) {
				mappings.cardTypes[parsed.cardType] = [];
			}
			mappings.cardTypes[parsed.cardType].push(cardIdSuffix);
		}
	}

	// Clean up and deduplicate
	for (const [categoryName, category] of Object.entries(mappings)) {
		if (categoryName === 'compounds') {
			// Handle compounds differently
			for (const key in category) {
				category[key].cards = [...new Set(category[key].cards)].sort();
			}
		} else {
			// Handle regular arrays
			for (const key in category) {
				category[key] = [...new Set(category[key])].sort();
			}
		}
	}

	return mappings;
}

function generateReverseSelectorsFile(mappings: ReverseMappings): string {
	const lines: string[] = [];

	// File header
	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * Run: npx tsx build-reverse-mappings.ts to update');
	lines.push(' */');
	lines.push('');

	// Imports
	lines.push("import { CardIds } from '@firestone-hs/reference-data';");
	lines.push("import { DeckCard } from '@firestone/game-state';");
	lines.push("import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';");
	lines.push("import { Selector } from '../cards-highlight-common.service';");
	lines.push("import { and, or, side, inDeck, inHand, cardIs } from '../selectors';");
	lines.push('');

	// Main function
	lines.push('export const reverseCardIdSelector = (');
	lines.push('	cardId: string,');
	lines.push('	card: DeckCard | undefined,');
	lines.push('	inputSide: HighlightSide,');
	lines.push('	allCards: CardsFacadeService,');
	lines.push('): Selector => {');
	lines.push('	const refCard = allCards.getCard(cardId);');
	lines.push('	if (!refCard) return null;');
	lines.push('');

	// Race-based reverse selectors
	lines.push('	// Race-based reverse synergies');
	lines.push('	if (refCard.races?.length) {');
	for (const [race, cardIds] of Object.entries(mappings.races)) {
		if (cardIds.length >= 5) {
			// Only include races with significant synergies - include ALL cards
			const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(`		if (refCard.races.map(r => r.toUpperCase()).includes('${race.toUpperCase()}')) {`);
			lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`				${cardsList}`);
			lines.push(`			));`);
			lines.push('		}');
		}
	}
	lines.push('	}');
	lines.push('');

	// Spell school reverse selectors
	lines.push('	// Spell school reverse synergies');
	lines.push("	if (refCard.spellSchool && refCard.type?.toUpperCase() === 'SPELL') {");
	for (const [school, cardIds] of Object.entries(mappings.spellSchools)) {
		if (cardIds.length >= 3) {
			// Only include schools with decent synergies - include ALL cards
			const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(`		if (refCard.spellSchool?.toUpperCase() === '${school.toUpperCase()}') {`);
			lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`				${cardsList}`);
			lines.push(`			));`);
			lines.push('		}');
		}
	}
	lines.push('	}');
	lines.push('');

	// Card type reverse selectors
	lines.push('	// Card type reverse synergies');
	for (const [type, cardIds] of Object.entries(mappings.cardTypes)) {
		if (cardIds.length >= 5) {
			// Only include card types with significant synergies - include ALL cards
			const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(`	if (refCard.type?.toUpperCase() === '${type.toUpperCase()}') {`);
			lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`			${cardsList}`);
			lines.push(`		));`);
			lines.push('	}');
		}
	}
	lines.push('');

	// Compound conditions
	lines.push('	// Compound condition reverse synergies');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		if (compoundData.cards.length >= 3) {
			// Only include compounds with decent synergies
			const cardsList = compoundData.cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(`	if (${compoundData.condition}) {`);
			lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`			${cardsList}`);
			lines.push(`		));`);
			lines.push('	}');
		}
	}
	lines.push('');

	lines.push('	return null;');
	lines.push('};');
	lines.push('');

	// Add summary comment
	lines.push('/**');
	lines.push(' * Reverse mapping summary:');
	lines.push(' * Races:');
	for (const [race, cardIds] of Object.entries(mappings.races)) {
		lines.push(` *   ${race}: ${cardIds.length} cards want this`);
	}
	lines.push(' * Spell Schools:');
	for (const [school, cardIds] of Object.entries(mappings.spellSchools)) {
		lines.push(` *   ${school}: ${cardIds.length} cards want this`);
	}
	lines.push(' * Card Types:');
	for (const [type, cardIds] of Object.entries(mappings.cardTypes)) {
		lines.push(` *   ${type}: ${cardIds.length} cards want this`);
	}
	lines.push(' * Mechanics:');
	for (const [mechanic, cardIds] of Object.entries(mappings.mechanics)) {
		lines.push(` *   ${mechanic}: ${cardIds.length} cards want this`);
	}
	lines.push(' * Compound Conditions:');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		lines.push(` *   ${compoundKey}: ${compoundData.cards.length} cards want this`);
	}
	lines.push(' */');

	return lines.join('\n');
}

function writeReverseSelectorsFile(mappings: ReverseMappings): void {
	const reverseCode = generateReverseSelectorsFile(mappings);

	// Write the generated file to the parent directory (with the other selectors)
	const outputPath = path.join(__dirname, '.', 'reverse-card-id-selectors.ts');
	fs.writeFileSync(outputPath, reverseCode, 'utf8');
	console.log('✅ Generated reverse selectors file: reverse-card-id-selectors.ts');
}

// Main execution
async function main() {
	console.log('🔍 Analyzing existing card selectors...');

	try {
		const mappings = buildReverseMappings();

		// Print summary
		console.log('\n📊 Analysis Summary:');
		console.log('Races:');
		for (const [race, cardIds] of Object.entries(mappings.races)) {
			console.log(`  ${race}: ${cardIds.length} cards`);
		}
		console.log('Spell Schools:');
		for (const [school, cardIds] of Object.entries(mappings.spellSchools)) {
			console.log(`  ${school}: ${cardIds.length} cards`);
		}
		console.log('Card Types:');
		for (const [type, cardIds] of Object.entries(mappings.cardTypes)) {
			console.log(`  ${type}: ${cardIds.length} cards`);
		}
		console.log('Mechanics:');
		for (const [mechanic, cardIds] of Object.entries(mappings.mechanics)) {
			console.log(`  ${mechanic}: ${cardIds.length} cards`);
		}
		console.log('Compound Conditions:');
		for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
			console.log(`  ${compoundKey}: ${compoundData.cards.length} cards`);
		}

		// Generate reverse selectors file
		console.log('\n🔧 Generating reverse synergy code...');
		writeReverseSelectorsFile(mappings);

		// Write analysis report
		const reportPath = path.join(__dirname, 'reverse-mappings-analysis.json');
		fs.writeFileSync(reportPath, JSON.stringify(mappings, null, 2), 'utf8');
		console.log(`📝 Analysis report saved to: ${reportPath}`);

		console.log('\n✅ Reverse synergies generation complete!');
		console.log('💡 The reverse synergies have been automatically injected into the highlight system.');
	} catch (error) {
		console.error('❌ Failed to build reverse mappings:', error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
