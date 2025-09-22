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
	// Cost conditions -> [cards that want this cost condition]
	costs: { [condition: string]: string[] };
	// Attack conditions -> [cards that want this attack condition]
	attacks: { [condition: string]: string[] };
	// Health conditions -> [cards that want this health condition]
	healths: { [condition: string]: string[] };
	// Other conditions -> [cards that want this condition]
	others: { [condition: string]: string[] };
	// Complex compound conditions -> [cards that want this combination]
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
	// Additional parsed data
	costConditions: string[];
	attackConditions: string[];
	healthConditions: string[];
	locationConditions: string[];
	otherConditions: string[];
	// Complexity level
	complexityLevel: 'simple' | 'medium' | 'complex';
}

function parseSelector(selectorCode: string): ParsedSelector {
	const result: ParsedSelector = {
		mechanics: [],
		filters: [],
		conditions: selectorCode,
		isCompound: false,
		costConditions: [],
		attackConditions: [],
		healthConditions: [],
		locationConditions: [],
		otherConditions: [],
		complexityLevel: 'simple',
	};

	// Determine complexity level first
	if (
		selectorCode.includes('highlightConditions') ||
		selectorCode.includes('input: SelectorInput') ||
		selectorCode.includes('tooltip') ||
		selectorCode.length > 800
	) {
		result.complexityLevel = 'complex';
	} else if (
		selectorCode.includes('cardIs(') ||
		selectorCode.includes('entityIs(') ||
		selectorCode.includes('or(') ||
		selectorCode.includes('not(') ||
		selectorCode.length > 200
	) {
		result.complexityLevel = 'medium';
	}

	// Find card type (most generic)
	// Check for direct function calls first (more specific)
	if (/\bspell\b/.test(selectorCode)) {
		result.cardType = 'spell';
	} else if (/\bminion\b/.test(selectorCode)) {
		result.cardType = 'minion';
	} else if (/\bweapon\b/.test(selectorCode)) {
		result.cardType = 'weapon';
	} else if (/\blocation\b/.test(selectorCode)) {
		result.cardType = 'location';
	} else {
		// Fall back to generic cardType checks
		for (const cardType of SELECTOR_HIERARCHY.cardTypes) {
			if (new RegExp(`\\b${cardType}\\b`, 'i').test(selectorCode)) {
				result.cardType = cardType;
				break; // Take the first match
			}
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
	// Check for direct spell school function calls first
	if (/\bholy\b/.test(selectorCode)) {
		result.spellSchool = 'holy';
	} else if (/\bfrost\b/.test(selectorCode)) {
		result.spellSchool = 'frost';
	} else if (/\bfire\b/.test(selectorCode)) {
		result.spellSchool = 'fire';
	} else if (/\bnature\b/.test(selectorCode)) {
		result.spellSchool = 'nature';
	} else if (/\bshadow\b/.test(selectorCode)) {
		result.spellSchool = 'shadow';
	} else if (/\bfel\b/.test(selectorCode)) {
		result.spellSchool = 'fel';
	} else if (/\barcane\b/.test(selectorCode)) {
		result.spellSchool = 'arcane';
	} else {
		// Fall back to generic spell school checks
		for (const spellSchool of SELECTOR_HIERARCHY.spellSchools) {
			if (new RegExp(`\\b${spellSchool}\\b`, 'i').test(selectorCode)) {
				result.spellSchool = spellSchool;
				break; // Take the first match
			}
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

	// Parse specific condition types
	parseCostConditions(selectorCode, result);
	parseAttackConditions(selectorCode, result);
	parseHealthConditions(selectorCode, result);
	parseLocationConditions(selectorCode, result);
	parseOtherConditions(selectorCode, result);

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

function parseCostConditions(selectorCode: string, result: ParsedSelector): void {
	// Extract cost-related conditions
	const costPatterns = [
		{ pattern: /effectiveCostEqual\((\d+)\)/, type: 'equal' },
		{ pattern: /effectiveCostMore\((\d+)\)/, type: 'more' },
		{ pattern: /effectiveCostLess\((\d+)\)/, type: 'less' },
		{ pattern: /baseCostEqual\((\d+)\)/, type: 'baseEqual' },
		{ pattern: /baseCostMore\((\d+)\)/, type: 'baseMore' },
		{ pattern: /baseCostLess\((\d+)\)/, type: 'baseLess' },
		{ pattern: /costMore\((\d+)\)/, type: 'costMore' },
		{ pattern: /costLess\((\d+)\)/, type: 'costLess' },
	];

	for (const { pattern, type } of costPatterns) {
		const match = selectorCode.match(pattern);
		if (match) {
			result.costConditions.push(`${type}:${match[1]}`);
		}
	}
}

function parseAttackConditions(selectorCode: string, result: ParsedSelector): void {
	// Extract attack-related conditions
	const attackPatterns = [
		{ pattern: /attackGreaterThan\((\d+)\)/, type: 'greater' },
		{ pattern: /attackLessThan\((\d+)\)/, type: 'less' },
		{ pattern: /attackIs\((\d+)\)/, type: 'equal' },
	];

	for (const { pattern, type } of attackPatterns) {
		const match = selectorCode.match(pattern);
		if (match) {
			result.attackConditions.push(`${type}:${match[1]}`);
		}
	}
}

function parseHealthConditions(selectorCode: string, result: ParsedSelector): void {
	// Extract health-related conditions
	const healthPatterns = [
		{ pattern: /healthLessThan\((\d+)\)/, type: 'less' },
		{ pattern: /healthIs\((\d+)\)/, type: 'equal' },
		{ pattern: /healthBiggerThanAttack/, type: 'biggerThanAttack' },
	];

	for (const { pattern, type } of healthPatterns) {
		const match = selectorCode.match(pattern);
		if (match) {
			if (type === 'biggerThanAttack') {
				result.healthConditions.push('biggerThanAttack');
			} else {
				result.healthConditions.push(`${type}:${match[1]}`);
			}
		}
	}
}

function parseLocationConditions(selectorCode: string, result: ParsedSelector): void {
	// Extract location-related conditions
	const locationPatterns = [
		'inDeck',
		'inHand',
		'inGraveyard',
		'inPlay',
		'inOther',
		'inStartingHand',
		'inInitialDeck',
		'notInInitialDeck',
	];

	for (const location of locationPatterns) {
		if (new RegExp(`\\b${location}\\b`).test(selectorCode)) {
			result.locationConditions.push(location);
		}
	}
}

function parseOtherConditions(selectorCode: string, result: ParsedSelector): void {
	// Extract other special conditions
	const otherPatterns = [
		'legendary',
		'neutral',
		'fromAnotherClass',
		'fromAnotherClassStrict',
		'tribeless',
		'hasMultipleCopies',
		'currentClass',
		'notInInitialDeck',
		'generatesTemporaryCard',
		'hasSpellSchool',
		'dealsDamage',
		'restoreHealth',
		'givesArmor',
		'givesHeroAttack',
		'canTargetFriendlyCharacter',
		'canTargetFriendlyMinion',
	];

	for (const condition of otherPatterns) {
		// Check for regular condition
		if (new RegExp(`\\b${condition}\\b`).test(selectorCode)) {
			result.otherConditions.push(condition);
		}

		// Check for negated condition (not(condition))
		if (new RegExp(`\\bnot\\(${condition}\\)`).test(selectorCode)) {
			result.otherConditions.push(`not_${condition}`);
		}
	}
}

function buildReverseCondition(parsed: ParsedSelector): string | null {
	// Skip the most complex selectors for now
	if (parsed.complexityLevel === 'complex') {
		return null;
	}

	const conditions: string[] = [];

	// Build base type conditions
	if (parsed.cardType) {
		conditions.push(`refCard.type?.toUpperCase() === '${parsed.cardType.toUpperCase()}'`);
	}

	// Add tribe conditions
	if (parsed.tribe) {
		conditions.push(`refCard.races?.map(r => r.toUpperCase()).includes('${parsed.tribe.toUpperCase()}')`);
	}

	// Add spell school conditions
	if (parsed.spellSchool) {
		conditions.push(`refCard.spellSchool?.toUpperCase() === '${parsed.spellSchool.toUpperCase()}'`);
		// Ensure it's a spell if we have a spell school but no card type specified
		if (!parsed.cardType) {
			conditions.push(`refCard.type?.toUpperCase() === 'SPELL'`);
		}
	}

	// Add cost conditions
	for (const costCondition of parsed.costConditions) {
		const [type, value] = costCondition.split(':');
		switch (type) {
			case 'equal':
				conditions.push(`refCard.cost === ${value}`);
				break;
			case 'more':
				conditions.push(`refCard.cost > ${value}`);
				break;
			case 'less':
				conditions.push(`refCard.cost < ${value}`);
				break;
			case 'baseEqual':
				conditions.push(`refCard.cost === ${value}`); // Approximation
				break;
			case 'baseMore':
				conditions.push(`refCard.cost > ${value}`); // Approximation
				break;
			case 'baseLess':
				conditions.push(`refCard.cost < ${value}`); // Approximation
				break;
		}
	}

	// Add attack conditions
	for (const attackCondition of parsed.attackConditions) {
		const [type, value] = attackCondition.split(':');
		switch (type) {
			case 'greater':
				conditions.push(`refCard.attack > ${value}`);
				break;
			case 'less':
				conditions.push(`refCard.attack < ${value}`);
				break;
			case 'equal':
				conditions.push(`refCard.attack === ${value}`);
				break;
		}
	}

	// Add health conditions
	for (const healthCondition of parsed.healthConditions) {
		if (healthCondition === 'biggerThanAttack') {
			conditions.push(`refCard.health > refCard.attack`);
		} else {
			const [type, value] = healthCondition.split(':');
			switch (type) {
				case 'less':
					conditions.push(`refCard.health < ${value}`);
					break;
				case 'equal':
					conditions.push(`refCard.health === ${value}`);
					break;
			}
		}
	}

	// Add mechanics conditions (basic ones we can handle)
	for (const mechanic of parsed.mechanics) {
		switch (mechanic) {
			case 'legendary':
				conditions.push(`refCard.rarity?.toUpperCase() === 'LEGENDARY'`);
				break;
			case 'secret':
				conditions.push(`refCard.mechanics?.includes('SECRET')`);
				break;
			case 'deathrattle':
				conditions.push(`refCard.mechanics?.includes('DEATHRATTLE')`);
				break;
			case 'battlecry':
				conditions.push(`refCard.mechanics?.includes('BATTLECRY')`);
				break;
			case 'taunt':
				conditions.push(`refCard.mechanics?.includes('TAUNT')`);
				break;
			case 'rush':
				conditions.push(`refCard.mechanics?.includes('RUSH')`);
				break;
			case 'charge':
				conditions.push(`refCard.mechanics?.includes('CHARGE')`);
				break;
			case 'windfury':
				conditions.push(`refCard.mechanics?.includes('WINDFURY')`);
				break;
			case 'divineShield':
				conditions.push(`refCard.mechanics?.includes('DIVINE_SHIELD')`);
				break;
			case 'lifesteal':
				conditions.push(`refCard.mechanics?.includes('LIFESTEAL')`);
				break;
			// Add more mechanics as needed
		}
	}

	// Add other conditions
	for (const otherCondition of parsed.otherConditions) {
		switch (otherCondition) {
			case 'neutral':
				conditions.push(`refCard.classes?.includes('NEUTRAL')`);
				break;
			case 'tribeless':
				conditions.push(`!refCard.races || refCard.races.length === 0`);
				break;
			case 'hasSpellSchool':
				conditions.push(`!!refCard.spellSchool`);
				break;
			case 'dealsDamage':
				// This is complex to determine, skip for now
				break;
		}
	}

	// Return null if we don't have meaningful conditions
	if (conditions.length === 0) {
		return null;
	}

	// Don't create reverse conditions that are too generic
	if (
		conditions.length === 1 &&
		parsed.cardType &&
		!parsed.tribe &&
		!parsed.spellSchool &&
		parsed.mechanics.length === 0 &&
		parsed.costConditions.length === 0 &&
		parsed.attackConditions.length === 0 &&
		parsed.healthConditions.length === 0
	) {
		// Only card type, too generic unless it's a specific type with low count
		if (['location'].includes(parsed.cardType)) {
			return conditions.join(' && ');
		}
		return null;
	}

	return conditions.join(' && ');
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
		costs: {},
		attacks: {},
		healths: {},
		others: {},
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

		// Categorize by the most specific selector or create compound condition
		let categorized = false;

		// Create a compound key for complex conditions
		const keyParts: string[] = [];
		if (parsed.tribe) keyParts.push(`tribe:${parsed.tribe}`);
		if (parsed.spellSchool) keyParts.push(`school:${parsed.spellSchool}`);
		if (parsed.cardType) keyParts.push(`type:${parsed.cardType}`);
		if (parsed.mechanics.length > 0) keyParts.push(`mechanics:${parsed.mechanics.sort().join(',')}`);
		if (parsed.costConditions.length > 0) keyParts.push(`cost:${parsed.costConditions.sort().join(',')}`);
		if (parsed.attackConditions.length > 0) keyParts.push(`attack:${parsed.attackConditions.sort().join(',')}`);
		if (parsed.healthConditions.length > 0) keyParts.push(`health:${parsed.healthConditions.sort().join(',')}`);
		if (parsed.otherConditions.length > 0) keyParts.push(`other:${parsed.otherConditions.sort().join(',')}`);

		// If we have multiple specific conditions, create a compound
		if (
			keyParts.length > 1 ||
			parsed.costConditions.length > 0 ||
			parsed.attackConditions.length > 0 ||
			parsed.healthConditions.length > 0 ||
			parsed.mechanics.length > 0
		) {
			const compoundKey = keyParts.join('+');
			if (!mappings.compounds[compoundKey]) {
				mappings.compounds[compoundKey] = {
					cards: [],
					condition: reverseCondition,
				};
			}
			mappings.compounds[compoundKey].cards.push(cardIdSuffix);
			categorized = true;
		}

		// If not categorized as compound, try simple categories
		if (!categorized) {
			// Prioritize spell school + spell combinations for simple categorization
			if (
				parsed.spellSchool &&
				parsed.cardType === 'spell' &&
				parsed.mechanics.length === 0 &&
				parsed.costConditions.length === 0
			) {
				if (!mappings.spellSchools[parsed.spellSchool]) {
					mappings.spellSchools[parsed.spellSchool] = [];
				}
				mappings.spellSchools[parsed.spellSchool].push(cardIdSuffix);
				categorized = true;
			} else if (
				parsed.tribe &&
				!parsed.spellSchool &&
				parsed.mechanics.length === 0 &&
				parsed.costConditions.length === 0
			) {
				if (!mappings.races[parsed.tribe]) {
					mappings.races[parsed.tribe] = [];
				}
				mappings.races[parsed.tribe].push(cardIdSuffix);
				categorized = true;
			} else if (
				parsed.cardType &&
				parsed.mechanics.length === 0 &&
				!parsed.tribe &&
				!parsed.spellSchool &&
				parsed.costConditions.length === 0
			) {
				// Only include card types without mechanics, tribes, or spell schools
				if (!mappings.cardTypes[parsed.cardType]) {
					mappings.cardTypes[parsed.cardType] = [];
				}
				mappings.cardTypes[parsed.cardType].push(cardIdSuffix);
				categorized = true;
			}
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

function generateReverseSelectorsFile(mappings: ReverseMappings): { [filename: string]: string } {
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
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`		if (refCard.races.map(r => r.toUpperCase()).includes('${race.toUpperCase()}')) {`);
		lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`				${cardsList}`);
		lines.push(`			));`);
		lines.push('		}');
	}
	lines.push('	}');
	lines.push('');

	// Spell school reverse selectors
	lines.push('	// Spell school reverse synergies');
	lines.push("	if (refCard.spellSchool && refCard.type?.toUpperCase() === 'SPELL') {");
	for (const [school, cardIds] of Object.entries(mappings.spellSchools)) {
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`		if (refCard.spellSchool?.toUpperCase() === '${school.toUpperCase()}') {`);
		lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`				${cardsList}`);
		lines.push(`			));`);
		lines.push('		}');
	}
	lines.push('	}');
	lines.push('');

	// Card type reverse selectors
	lines.push('	// Card type reverse synergies');
	for (const [type, cardIds] of Object.entries(mappings.cardTypes)) {
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`	if (refCard.type?.toUpperCase() === '${type.toUpperCase()}') {`);
		lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`			${cardsList}`);
		lines.push(`		));`);
		lines.push('	}');
	}
	lines.push('');

	// Compound conditions
	lines.push('	// Complex condition reverse synergies');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		const cardsList = compoundData.cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`	// ${compoundKey} (${compoundData.cards.length} card${compoundData.cards.length > 1 ? 's' : ''})`);
		lines.push(`	if (${compoundData.condition}) {`);
		lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`			${cardsList}`);
		lines.push(`		));`);
		lines.push('	}');
		lines.push('');
	}

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
	lines.push(' * Complex Conditions:');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		lines.push(` *   ${compoundKey}: ${compoundData.cards.length} cards want this`);
	}
	lines.push(' */');

	// Generate multiple specialized files
	const files: { [filename: string]: string } = {};

	// Generate specialized files
	files['reverse-minion-selectors.ts'] = generateMinionSelectorsFile(mappings);
	files['reverse-spell-selectors.ts'] = generateSpellSelectorsFile(mappings);
	files['reverse-general-selectors.ts'] = generateGeneralSelectorsFile(mappings);

	// Generate main entry point that delegates to specialized files
	files['reverse-card-id-selectors.ts'] = generateMainEntryFile();

	return files;
}

function generateMinionSelectorsFile(mappings: ReverseMappings): string {
	const lines: string[] = [];

	// File header
	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * Run: npm run build:reverse-synergies to update');
	lines.push(' * MINION-SPECIFIC REVERSE SYNERGIES');
	lines.push(' */');
	lines.push('');
	lines.push("import { CardIds } from '@firestone-hs/reference-data';");
	lines.push("import { DeckCard } from '@firestone/game-state';");
	lines.push("import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';");
	lines.push("import { Selector } from '../cards-highlight-common.service';");
	lines.push("import { and, or, side, inDeck, inHand, cardIs } from '../selectors';");
	lines.push('');
	lines.push('export const reverseMinionSelector = (');
	lines.push('	cardId: string,');
	lines.push('	card: DeckCard | undefined,');
	lines.push('	inputSide: HighlightSide,');
	lines.push('	allCards: CardsFacadeService,');
	lines.push('): Selector => {');
	lines.push('	const refCard = allCards.getCard(cardId);');
	lines.push('	if (!refCard) return null;');
	lines.push('');

	// Race-based reverse selectors (for minions)
	lines.push('	// Race-based reverse synergies');
	lines.push('	if (refCard.races?.length) {');
	for (const [race, cardIds] of Object.entries(mappings.races)) {
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`		if (refCard.races.map(r => r.toUpperCase()).includes('${race.toUpperCase()}')) {`);
		lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`				${cardsList}`);
		lines.push(`			));`);
		lines.push('		}');
	}
	lines.push('	}');
	lines.push('');

	// Minion-specific compound conditions
	lines.push('	// Minion-specific complex conditions');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		if (
			compoundKey.includes('type:minion') ||
			compoundKey.includes('tribe:') ||
			compoundKey.includes('attack:') ||
			compoundKey.includes('health:')
		) {
			const cardsList = compoundData.cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(
				`	// ${compoundKey} (${compoundData.cards.length} card${compoundData.cards.length > 1 ? 's' : ''})`,
			);
			lines.push(`	if (${compoundData.condition}) {`);
			lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`			${cardsList}`);
			lines.push(`		));`);
			lines.push('	}');
			lines.push('');
		}
	}

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateSpellSelectorsFile(mappings: ReverseMappings): string {
	const lines: string[] = [];

	// File header
	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * Run: npm run build:reverse-synergies to update');
	lines.push(' * SPELL-SPECIFIC REVERSE SYNERGIES');
	lines.push(' */');
	lines.push('');
	lines.push("import { CardIds } from '@firestone-hs/reference-data';");
	lines.push("import { DeckCard } from '@firestone/game-state';");
	lines.push("import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';");
	lines.push("import { Selector } from '../cards-highlight-common.service';");
	lines.push("import { and, or, side, inDeck, inHand, cardIs } from '../selectors';");
	lines.push('');
	lines.push('export const reverseSpellSelector = (');
	lines.push('	cardId: string,');
	lines.push('	card: DeckCard | undefined,');
	lines.push('	inputSide: HighlightSide,');
	lines.push('	allCards: CardsFacadeService,');
	lines.push('): Selector => {');
	lines.push('	const refCard = allCards.getCard(cardId);');
	lines.push('	if (!refCard) return null;');
	lines.push('');

	// Spell school reverse selectors
	lines.push('	// Spell school reverse synergies');
	lines.push("	if (refCard.spellSchool && refCard.type?.toUpperCase() === 'SPELL') {");
	for (const [school, cardIds] of Object.entries(mappings.spellSchools)) {
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`		if (refCard.spellSchool?.toUpperCase() === '${school.toUpperCase()}') {`);
		lines.push(`			return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`				${cardsList}`);
		lines.push(`			));`);
		lines.push('		}');
	}
	lines.push('	}');
	lines.push('');

	// Spell-specific compound conditions
	lines.push('	// Spell-specific complex conditions');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		if (compoundKey.includes('type:spell') || compoundKey.includes('school:')) {
			const cardsList = compoundData.cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(
				`	// ${compoundKey} (${compoundData.cards.length} card${compoundData.cards.length > 1 ? 's' : ''})`,
			);
			lines.push(`	if (${compoundData.condition}) {`);
			lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`			${cardsList}`);
			lines.push(`		));`);
			lines.push('	}');
			lines.push('');
		}
	}

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateGeneralSelectorsFile(mappings: ReverseMappings): string {
	const lines: string[] = [];

	// File header
	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * Run: npm run build:reverse-synergies to update');
	lines.push(' * GENERAL REVERSE SYNERGIES (weapons, locations, mechanics, etc.)');
	lines.push(' */');
	lines.push('');
	lines.push("import { CardIds } from '@firestone-hs/reference-data';");
	lines.push("import { DeckCard } from '@firestone/game-state';");
	lines.push("import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';");
	lines.push("import { Selector } from '../cards-highlight-common.service';");
	lines.push("import { and, or, side, inDeck, inHand, cardIs } from '../selectors';");
	lines.push('');
	lines.push('export const reverseGeneralSelector = (');
	lines.push('	cardId: string,');
	lines.push('	card: DeckCard | undefined,');
	lines.push('	inputSide: HighlightSide,');
	lines.push('	allCards: CardsFacadeService,');
	lines.push('): Selector => {');
	lines.push('	const refCard = allCards.getCard(cardId);');
	lines.push('	if (!refCard) return null;');
	lines.push('');

	// Card type reverse selectors (weapons, locations)
	lines.push('	// Card type reverse synergies');
	for (const [type, cardIds] of Object.entries(mappings.cardTypes)) {
		const cardsList = cardIds.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
		lines.push(`	if (refCard.type?.toUpperCase() === '${type.toUpperCase()}') {`);
		lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
		lines.push(`			${cardsList}`);
		lines.push(`		));`);
		lines.push('	}');
	}
	lines.push('');

	// General compound conditions (mechanics, costs, etc.)
	lines.push('	// General complex conditions');
	for (const [compoundKey, compoundData] of Object.entries(mappings.compounds)) {
		if (
			!compoundKey.includes('type:minion') &&
			!compoundKey.includes('type:spell') &&
			!compoundKey.includes('school:') &&
			!compoundKey.includes('tribe:')
		) {
			const cardsList = compoundData.cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(
				`	// ${compoundKey} (${compoundData.cards.length} card${compoundData.cards.length > 1 ? 's' : ''})`,
			);
			lines.push(`	if (${compoundData.condition}) {`);
			lines.push(`		return and(side(inputSide), or(inDeck, inHand), cardIs(`);
			lines.push(`			${cardsList}`);
			lines.push(`		));`);
			lines.push('	}');
			lines.push('');
		}
	}

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateMainEntryFile(): string {
	const lines: string[] = [];

	// File header
	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * Run: npm run build:reverse-synergies to update');
	lines.push(' * MAIN ENTRY POINT FOR REVERSE SYNERGIES - delegates to specialized files');
	lines.push(' */');
	lines.push('');
	lines.push("import { DeckCard } from '@firestone/game-state';");
	lines.push("import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';");
	lines.push("import { Selector } from '../cards-highlight-common.service';");
	lines.push("import { reverseMinionSelector } from './reverse-minion-selectors';");
	lines.push("import { reverseSpellSelector } from './reverse-spell-selectors';");
	lines.push("import { reverseGeneralSelector } from './reverse-general-selectors';");
	lines.push('');
	lines.push('export const reverseCardIdSelector = (');
	lines.push('	cardId: string,');
	lines.push('	card: DeckCard | undefined,');
	lines.push('	inputSide: HighlightSide,');
	lines.push('	allCards: CardsFacadeService,');
	lines.push('): Selector => {');
	lines.push('	const refCard = allCards.getCard(cardId);');
	lines.push('	if (!refCard) return null;');
	lines.push('');
	lines.push('	// Try minion-specific selectors first');
	lines.push("	if (refCard.type?.toUpperCase() === 'MINION') {");
	lines.push('		const minionResult = reverseMinionSelector(cardId, card, inputSide, allCards);');
	lines.push('		if (minionResult) return minionResult;');
	lines.push('	}');
	lines.push('');
	lines.push('	// Try spell-specific selectors');
	lines.push("	if (refCard.type?.toUpperCase() === 'SPELL') {");
	lines.push('		const spellResult = reverseSpellSelector(cardId, card, inputSide, allCards);');
	lines.push('		if (spellResult) return spellResult;');
	lines.push('	}');
	lines.push('');
	lines.push('	// Try general selectors (weapons, locations, mechanics)');
	lines.push('	const generalResult = reverseGeneralSelector(cardId, card, inputSide, allCards);');
	lines.push('	if (generalResult) return generalResult;');
	lines.push('');
	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function writeReverseSelectorsFile(mappings: ReverseMappings): void {
	const files = generateReverseSelectorsFile(mappings);

	// Write all generated files to the parent directory (with the other selectors)
	for (const [filename, content] of Object.entries(files)) {
		const outputPath = path.join(__dirname, '.', filename);
		fs.writeFileSync(outputPath, content, 'utf8');
		console.log(`✅ Generated file: ${filename}`);
	}
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
		console.log('Complex Conditions:');
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
