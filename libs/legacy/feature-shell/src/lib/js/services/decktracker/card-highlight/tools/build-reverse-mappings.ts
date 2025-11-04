/**
 * Reverse synergy mapping generator - NEW APPROACH
 * This script analyzes the existing card-id-selectors.ts file case by case
 * and generates reverse synergy mappings by expanding selector conditions.
 *
 * Process:
 * 1. Extract each card case and expand OR conditions into individual mappings
 * 2. Create flat mapping: condition -> [cards]
 * 3. Group identical conditions and generate reverse selector files
 *
 * Run: npx tsx build-reverse-mappings-v2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Step 1: Extract card cases and expand conditions
interface ConditionMapping {
	cardId: string;
	conditions: string[];
}

function extractCardConditions(): ConditionMapping[] {
	const selectorsFilePath = path.join(__dirname, '..', 'card-id-selectors.ts');
	const content = fs.readFileSync(selectorsFilePath, 'utf8');

	// Find the switch statement and extract each case
	const switchMatch = content.match(/switch\s*\([^)]+\)\s*\{([\s\S]*)\}/);
	if (!switchMatch) {
		console.log('❌ Could not find switch statement');
		// Try to find any switch statement
		const anySwitch = content.match(/switch/g);
		console.log(`Found ${anySwitch ? anySwitch.length : 0} 'switch' keywords in file`);
		throw new Error('Could not find switch statement in card-id-selectors.ts');
	}

	const switchBody = switchMatch[1];
	console.log(`📏 Switch body length: ${switchBody.length} characters`);
	console.log(`🔍 First 200 chars of switch body: ${switchBody.substring(0, 200)}`);

	const cases = switchBody.match(/case\s+CardIds\.([^:]+):[\s\S]*?(?=case\s+CardIds\.|default:|$)/g);

	if (!cases) {
		console.log('❌ Could not extract cases from switch statement');
		// Try a simpler pattern
		const simpleCases = switchBody.match(/case\s+CardIds\./g);
		console.log(`Found ${simpleCases ? simpleCases.length : 0} 'case CardIds.' patterns`);
		throw new Error('Could not extract cases from switch statement');
	}

	const mappings: ConditionMapping[] = [];
	let totalCases = 0;
	let skippedComplex = 0;
	let skippedNoConditions = 0;
	let processedFallthroughs = 0;

	// Process cases and handle fallthroughs
	for (let i = 0; i < cases.length; i++) {
		const caseMatch = cases[i];
		totalCases++;

		const cardIdMatches = caseMatch.match(/case\s+CardIds\.([^:]+):/g);
		const returnMatch = caseMatch.match(/return\s+(.*?);/s);

		if (cardIdMatches && returnMatch) {
			// This case has a return statement
			const selectorCode = returnMatch[1].replace(/\s+/g, ' ').trim();

			// Handle tooltip by removing it (treat as 'and')
			let cleanedSelectorCode = selectorCode;
			if (selectorCode.includes('tooltip:')) {
				// Remove tooltip parts but keep the rest
				cleanedSelectorCode = selectorCode
					.replace(/tooltip:\s*[^,)]+/g, '')
					.replace(/,\s*,/g, ',')
					.replace(/^\s*,|,\s*$/g, '');
			}

			// Skip complex input parameter selectors entirely
			if (selectorCode.includes('input:') || selectorCode.includes('(input: SelectorInput)')) {
				skippedComplex++;
				continue;
			}

			// Handle highlightConditions as 'or' - support both array and function call syntax
			if (selectorCode.includes('highlightConditions')) {
				// Try array syntax first: highlightConditions: [...]
				const arrayMatch = selectorCode.match(/highlightConditions:\s*\[([\s\S]*?)\]/);
				if (arrayMatch) {
					const conditionsContent = arrayMatch[1];
					cleanedSelectorCode = `or(${conditionsContent})`;
				} else {
					// Try function call syntax: highlightConditions(arg1, arg2, ...)
					const functionMatch = selectorCode.match(/highlightConditions\(([\s\S]*)\)/);
					if (functionMatch) {
						const conditionsContent = functionMatch[1];
						cleanedSelectorCode = `or(${conditionsContent})`;
					}
				}
			}

			// Skip remaining complex cases
			if (cleanedSelectorCode.length > 800) {
				skippedComplex++;
				continue;
			}

			const conditions = expandSelectorConditions(cleanedSelectorCode);

			// Apply conditions to all card IDs in this case block (including fallthroughs)
			for (const cardIdMatch of cardIdMatches) {
				const cardIdSuffix = cardIdMatch.match(/case\s+CardIds\.([^:]+):/)?.[1];
				if (cardIdSuffix && conditions.length > 0) {
					mappings.push({
						cardId: cardIdSuffix,
						conditions: conditions,
					});
				}
			}

			if (cardIdMatches.length > 1) {
				processedFallthroughs += cardIdMatches.length - 1;
			}
		} else if (cardIdMatches) {
			// This is a fallthrough case - find the next case with a return statement
			let foundReturn = false;
			for (let j = i + 1; j < cases.length && !foundReturn; j++) {
				const nextCase = cases[j];
				const nextReturnMatch = nextCase.match(/return\s+(.*?);/s);

				if (nextReturnMatch) {
					foundReturn = true;
					const selectorCode = nextReturnMatch[1].replace(/\s+/g, ' ').trim();

					// Skip complex input parameter selectors entirely
					if (selectorCode.includes('input:') || selectorCode.includes('(input: SelectorInput)')) {
						break; // Don't process this fallthrough
					}

					// Handle tooltip by removing it
					let cleanedSelectorCode = selectorCode;
					if (selectorCode.includes('tooltip:')) {
						cleanedSelectorCode = selectorCode
							.replace(/tooltip:\s*[^,)]+/g, '')
							.replace(/,\s*,/g, ',')
							.replace(/^\s*,|,\s*$/g, '');
					}

					// Handle highlightConditions as 'or' - support both array and function call syntax
					if (selectorCode.includes('highlightConditions')) {
						// Try array syntax first: highlightConditions: [...]
						const arrayMatch = selectorCode.match(/highlightConditions:\s*\[([\s\S]*?)\]/);
						if (arrayMatch) {
							const conditionsContent = arrayMatch[1];
							cleanedSelectorCode = `or(${conditionsContent})`;
						} else {
							// Try function call syntax: highlightConditions(arg1, arg2, ...)
							const functionMatch = selectorCode.match(/highlightConditions\(([\s\S]*)\)/);
							if (functionMatch) {
								const conditionsContent = functionMatch[1];
								cleanedSelectorCode = `or(${conditionsContent})`;
							}
						}
					}

					// Skip remaining complex cases
					if (cleanedSelectorCode.length > 800) {
						break; // Don't process this fallthrough
					}

					const conditions = expandSelectorConditions(cleanedSelectorCode);

					// Apply to all fallthrough card IDs
					for (const cardIdMatch of cardIdMatches) {
						const cardIdSuffix = cardIdMatch.match(/case\s+CardIds\.([^:]+):/)?.[1];
						if (cardIdSuffix && conditions.length > 0) {
							mappings.push({
								cardId: cardIdSuffix,
								conditions: conditions,
							});
							processedFallthroughs++;
						}
					}
				}
			}

			if (!foundReturn) {
				skippedNoConditions++;
			}
		}
	}

	console.log(
		`📊 Processing stats: ${totalCases} total cases, ${skippedComplex} skipped (complex), ${skippedNoConditions} skipped (no conditions), ${mappings.length} processed, ${processedFallthroughs} fallthroughs handled`,
	);

	return mappings;
}

function expandSelectorConditions(selectorCode: string): string[] {
	// Remove generic selectors that we don't care about for reverse mapping
	const genericSelectors = [
		'side(inputSide)',
		'not(side(inputSide))',
		'inDeck',
		'inHand',
		'inGraveyard',
		'inPlay',
		'inOther',
		'or(inDeck, inHand)',
		'or(inHand, inDeck)',
	];

	let cleanedCode = selectorCode;

	for (const generic of genericSelectors) {
		cleanedCode = cleanedCode.replace(new RegExp(generic.replace(/[()]/g, '\\$&'), 'g'), '').trim();
	}

	// Clean up extra commas and whitespace more thoroughly
	cleanedCode = cleanedCode
		.replace(/,\s*,+/g, ',') // Multiple consecutive commas
		.replace(/^\s*,+|,+\s*$/g, '') // Leading/trailing commas
		.replace(/and\(\s*,+/g, 'and(') // Comma after and(
		.replace(/,+\s*\)/g, ')') // Comma before )
		.replace(/\(\s*,+/g, '(') // Comma after (
		.replace(/,+\s*,+/g, ',') // Multiple commas again
		.replace(/or\(\s*,*\s*\)/g, '') // Remove empty or() clauses
		.replace(/and\(\s*,*\s*\)/g, '') // Remove empty and() clauses
		.trim();

	// Handle nested and() wrappers - extract content from and(...) calls
	cleanedCode = cleanedCode.replace(/and\(\s*([^)]+)\s*\)/g, '$1');

	// Final cleanup after and() removal
	cleanedCode = cleanedCode
		.replace(/^\s*,+|,+\s*$/g, '') // Remove leading/trailing commas again
		.replace(/,\s*,+/g, ',') // Clean up any remaining multiple commas
		.replace(/or\(\s*,*\s*\)/g, '') // Remove empty or() clauses again
		.replace(/and\(\s*,*\s*\)/g, '') // Remove empty and() clauses again
		.trim();

	// Handle simple cases first
	const conditions = extractConditionsFromCleanedCode(cleanedCode);
	return conditions.filter((c) => c.length > 0);
}

function extractConditionsFromCleanedCode(code: string): string[] {
	// Handle basic patterns
	const conditions: string[] = [];

	// Remove outer 'and(' wrapper if present
	if (code.startsWith('and(') && code.endsWith(')')) {
		code = code.slice(4, -1);
	}

	// Split by commas but respect nested parentheses
	const parts = smartSplit(code, ',');

	// Separate OR conditions from regular conditions
	const regularConditions: string[] = [];
	const orConditions: string[] = [];

	for (const part of parts) {
		const trimmed = part.trim();
		if (trimmed.startsWith('or(') && trimmed.endsWith(')')) {
			orConditions.push(trimmed);
		} else {
			// Check if this is a function that expands to multiple conditions
			const analyzedConditions = analyzeSelectorFunction(trimmed);
			if (analyzedConditions && analyzedConditions.length > 1) {
				// This function expands to multiple OR conditions
				for (const condition of analyzedConditions) {
					orConditions.push(`or(${condition})`);
				}
			} else {
				const condition = convertToConditionString(trimmed);
				if (condition) {
					regularConditions.push(condition);
				}
			}
		}
	}

	// Expand OR conditions
	const expandedOrConditions = expandOrConditions(orConditions);

	// Combine regular conditions with each expanded OR condition
	if (expandedOrConditions.length === 0) {
		// No OR conditions, just return regular conditions
		const result = regularConditions.length > 0 ? [regularConditions.sort().join(' + ')] : [];

		return result;
	} else {
		// Combine each OR expansion with regular conditions
		const results: string[] = [];
		for (const orExpansion of expandedOrConditions) {
			const combined = [...regularConditions, orExpansion].sort().join(' + ');
			results.push(combined);
		}

		return results;
	}
}

function smartSplit(str: string, delimiter: string): string[] {
	const parts: string[] = [];
	let current = '';
	let depth = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		if (char === '(') depth++;
		else if (char === ')') depth--;
		else if (char === delimiter && depth === 0) {
			if (current.trim()) parts.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}

	if (current.trim()) parts.push(current.trim());
	return parts;
}

// Function to analyze selector functions and extract their conditions
function analyzeSelectorFunction(functionName: string, visitedFunctions: Set<string> = new Set()): string[] | null {
	// Prevent infinite recursion
	if (visitedFunctions.has(functionName)) {
		return null;
	}
	visitedFunctions.add(functionName);

	const selectorsFilePath = path.join(__dirname, '..', 'selectors.ts');
	const content = fs.readFileSync(selectorsFilePath, 'utf8');

	// Look for the function definition
	const functionRegex = new RegExp(`export\\s+const\\s+${functionName}\\s*=\\s*([^;\\n]+)`, 's');
	const match = content.match(functionRegex);

	if (!match) {
		return null;
	}

	const definition = match[1].trim();

	// Parse different types of function definitions
	if (definition.startsWith('or(')) {
		// Handle or(condition1, condition2, ...)
		const orContent = definition.slice(3, -1); // Remove 'or(' and ')'
		const parts = smartSplit(orContent, ',');
		const conditions: string[] = [];

		for (const part of parts) {
			const trimmed = part.trim();

			// Check if this part is itself a function call that needs analysis
			const nestedAnalysis = analyzeSelectorFunction(trimmed, visitedFunctions);
			if (nestedAnalysis) {
				// If the nested function returns multiple conditions, add them all
				conditions.push(...nestedAnalysis);
			} else {
				// Handle direct hasMechanicStr calls
				if (trimmed.includes('hasMechanicStr(')) {
					const mechanicMatch = trimmed.match(/hasMechanicStr\(['"]([^'"]+)['"]\)/);
					if (mechanicMatch) {
						const mechanicName = mechanicMatch[1];
						conditions.push(`HAS_MECHANIC_${mechanicName}`);
					}
				} else if (trimmed.includes('cardType(')) {
					// Handle cardType(CardType.TYPE_NAME) calls
					const typeMatch = trimmed.match(/cardType\(CardType\.([^)]+)\)/);
					if (typeMatch) {
						const typeName = typeMatch[1];
						conditions.push(typeName.toUpperCase());
					}
				} else {
					const condition = convertToConditionString(trimmed);
					if (condition) {
						conditions.push(condition);
					}
				}
			}
		}

		return conditions.length > 0 ? conditions : null;
	} else if (definition.startsWith('and(')) {
		// Handle and(condition1, condition2, ...)
		const andContent = definition.slice(4, -1); // Remove 'and(' and ')'
		const parts = smartSplit(andContent, ',');
		const conditions: string[] = [];

		for (const part of parts) {
			const trimmed = part.trim();

			// Check if this part is itself a function call that needs analysis
			const nestedAnalysis = analyzeSelectorFunction(trimmed, visitedFunctions);
			if (nestedAnalysis) {
				// If the nested function returns multiple conditions, add them all
				conditions.push(...nestedAnalysis);
			} else {
				// Handle direct hasMechanicStr calls
				if (trimmed.includes('hasMechanicStr(')) {
					const mechanicMatch = trimmed.match(/hasMechanicStr\(['"]([^'"]+)['"]\)/);
					if (mechanicMatch) {
						const mechanicName = mechanicMatch[1];
						conditions.push(`HAS_MECHANIC_${mechanicName}`);
					}
				} else if (trimmed.includes('cardType(')) {
					// Handle cardType(CardType.TYPE_NAME) calls
					const typeMatch = trimmed.match(/cardType\(CardType\.([^)]+)\)/);
					if (typeMatch) {
						const typeName = typeMatch[1];
						conditions.push(typeName.toUpperCase());
					}
				} else {
					const condition = convertToConditionString(trimmed);
					if (condition) {
						conditions.push(condition);
					}
				}
			}
		}

		// For AND conditions, we need to combine them as a single compound condition
		return conditions.length > 0 ? [conditions.sort().join(' + ')] : null;
	} else if (definition.includes('hasMechanicStr(')) {
		// Handle hasMechanicStr('MECHANIC_NAME')
		const mechanicMatch = definition.match(/hasMechanicStr\(['"]([^'"]+)['"]\)/);
		if (mechanicMatch) {
			const mechanicName = mechanicMatch[1];
			return [`HAS_MECHANIC_${mechanicName}`];
		}
	} else if (definition.includes('hasMechanic(')) {
		// Handle hasMechanic(GameTag.MECHANIC_NAME)
		const mechanicMatch = definition.match(/hasMechanic\(GameTag\.([^)]+)\)/);
		if (mechanicMatch) {
			const mechanicName = mechanicMatch[1];
			return [`HAS_MECHANIC_${mechanicName}`];
		}
	} else if (definition.includes('cardType(')) {
		// Handle cardType(CardType.TYPE_NAME)
		const typeMatch = definition.match(/cardType\(CardType\.([^)]+)\)/);
		if (typeMatch) {
			const typeName = typeMatch[1];
			return [typeName.toUpperCase()];
		}
	}

	return null;
}

function convertToConditionString(part: string): string | null {
	// First, try to analyze if this is a function we can inspect
	const analyzedConditions = analyzeSelectorFunction(part);
	if (analyzedConditions) {
		// If it's an OR function (multiple conditions), this should be handled by the calling code
		// For now, just return null so the calling code can handle it properly
		if (analyzedConditions.length > 1) {
			console.log(`📋 Function ${part} expands to multiple conditions: ${analyzedConditions.join(', ')}`);
			return null; // Let the calling code handle multiple conditions
		}
		return analyzedConditions[0];
	}

	// Map function calls to condition strings
	const mappings: { [key: string]: string } = {
		minion: 'MINION',
		spell: 'SPELL',
		weapon: 'WEAPON',
		location: 'LOCATION',
		beast: 'BEAST',
		mech: 'MECH',
		dragon: 'DRAGON',
		murloc: 'MURLOC',
		pirate: 'PIRATE',
		demon: 'DEMON',
		elemental: 'ELEMENTAL',
		undead: 'UNDEAD',
		naga: 'NAGA',
		totem: 'TOTEM',
		holy: 'HOLY',
		frost: 'FROST',
		fire: 'FIRE',
		nature: 'NATURE',
		shadow: 'SHADOW',
		fel: 'FEL',
		arcane: 'ARCANE',
		deathrattle: 'DEATHRATTLE',
		battlecry: 'BATTLECRY',
		taunt: 'TAUNT',
		rush: 'RUSH',
		charge: 'CHARGE',
		windfury: 'WINDFURY',
		divineShield: 'DIVINE_SHIELD',
		lifesteal: 'LIFESTEAL',
		reborn: 'REBORN',
		magnetic: 'MAGNETIC',
		discover: 'DISCOVER',
		overload: 'OVERLOAD',
		combo: 'COMBO',
		outcast: 'OUTCAST',
		frenzy: 'FRENZY',
		corrupt: 'CORRUPT',
		corrupted: 'CORRUPTED',
		infuse: 'INFUSE',
		forge: 'FORGE',
		excavate: 'EXCAVATE',
		quickdraw: 'QUICKDRAW',
		tradeable: 'TRADEABLE',
		chooseOne: 'CHOOSE_ONE',
		secret: 'SECRET',
		legendary: 'LEGENDARY',
		tribeless: 'TRIBELESS',
		neutral: 'NEUTRAL',
		fromAnotherClass: 'FROM_ANOTHER_CLASS',
		hasMultipleCopies: 'HAS_MULTIPLE_COPIES',
		currentClass: 'CURRENT_CLASS',
		notInInitialDeck: 'NOT_IN_INITIAL_DECK',
		// Custom game-specific functions
		summonsTreant: 'SUMMONS_TREANT',
		isTreant: 'IS_TREANT',
		draenei: 'DRAENEI',
		spellDamage: 'SPELL_DAMAGE',
		stealth: 'STEALTH',
		poisonous: 'POISONOUS',
		immune: 'IMMUNE',
		cantAttack: 'CANT_ATTACK',
		cantBeTargetedBySpells: 'CANT_BE_TARGETED_BY_SPELLS',
		cantBeTargetedByHeroPowers: 'CANT_BE_TARGETED_BY_HERO_POWERS',
		adjacentBuff: 'ADJACENT_BUFF',
		inspire: 'INSPIRE',
		adapt: 'ADAPT',
		echo: 'ECHO',
		twinspell: 'TWINSPELL',
		lackey: 'LACKEY',
		invoke: 'INVOKE',
		spellburst: 'SPELLBURST',
		dormant: 'DORMANT',
		questline: 'QUESTLINE',
		questReward: 'QUEST_REWARD',
		sidequest: 'SIDEQUEST',
		galakrond: 'GALAKROND',
		cthun: 'CTHUN',
		jade: 'JADE',
		highlander: 'HIGHLANDER',
		evenCost: 'EVEN_COST',
		oddCost: 'ODD_COST',
		handbuff: 'HANDBUFF',
		recruit: 'RECRUIT',
		spell_school: 'SPELL_SCHOOL',
		aura: 'AURA',
		token: 'TOKEN',
		generated: 'GENERATED',
		collectible: 'COLLECTIBLE',
		// Race-specific
		all: 'ALL_RACES',
		// Mechanics
		silence: 'SILENCE',
		freeze: 'FREEZE',
		burn: 'BURN',
		mill: 'MILL',
		draw: 'DRAW',
		discard: 'DISCARD',
		transform: 'TRANSFORM',
		copy: 'COPY',
		shuffle: 'SHUFFLE',
		// Keywords that might appear
		keyword: 'KEYWORD',
		tribal: 'TRIBAL',
		synergy: 'SYNERGY',
		// Additional custom functions seen in warnings
		libram: 'LIBRAM',
		protoss: 'PROTOSS',
		zerg: 'ZERG',
		terran: 'TERRAN',
		templar: 'TEMPLAR',
		restoreHealth: 'RESTORE_HEALTH',
		dealsDamage: 'DEALS_DAMAGE',
		givesArmor: 'GIVES_ARMOR',
		starshipExtended: 'STARSHIP_EXTENDED',
		locationExtended: 'LOCATION_EXTENDED',
		darkGift: 'DARK_GIFT',
		imbue: 'IMBUE',
		dredge: 'DREDGE',
		generateCorpse: 'GENERATE_CORPSE',
		spendCorpse: 'SPEND_CORPSE',
		generatesPlague: 'GENERATES_PLAGUE',
		isPlague: 'IS_PLAGUE',
		generatesTemporaryCard: 'GENERATES_TEMPORARY_CARD',
		selfDamageHero: 'SELF_DAMAGE_HERO',
		canTargetFriendlyCharacter: 'CAN_TARGET_FRIENDLY_CHARACTER',
		canTargetFriendlyMinion: 'CAN_TARGET_FRIENDLY_MINION',
		shufflesCardIntoDeck: 'SHUFFLES_CARD_INTO_DECK',
		hasSpellSchool: 'HAS_SPELL_SCHOOL',
		paladin: 'PALADIN',
		imp: 'IMP',
		whelp: 'WHELP',
		relic: 'RELIC',
		kindred: 'KINDRED',
		isSi7: 'IS_SI7',
		generateSlagclaw: 'GENERATE_SLAGCLAW',
		libramDiscount: 'LIBRAM_DISCOUNT',
		damage: 'DAMAGE',
	};

	// Handle not() wrapper
	if (part.startsWith('not(') && part.endsWith(')')) {
		const inner = part.slice(4, -1);
		const innerCondition = mappings[inner];
		if (innerCondition) {
			return `NOT_${innerCondition}`;
		}
	}

	// Direct mapping
	if (mappings[part]) {
		return mappings[part];
	}

	// Handle cost conditions
	if (part.includes('effectiveCostMore(')) {
		const match = part.match(/effectiveCostMore\((\d+)\)/);
		if (match) return `COST_MORE_${match[1]}`;
	}
	if (part.includes('effectiveCostLess(')) {
		const match = part.match(/effectiveCostLess\((\d+)\)/);
		if (match) return `COST_LESS_${match[1]}`;
	}
	if (part.includes('effectiveCostEqual(')) {
		const match = part.match(/effectiveCostEqual\((\d+)\)/);
		if (match) return `COST_EQUAL_${match[1]}`;
	}
	if (part.includes('costMore(')) {
		const match = part.match(/costMore\((\d+)\)/);
		if (match) return `COST_MORE_${match[1]}`;
	}
	if (part.includes('costLess(')) {
		const match = part.match(/costLess\((\d+)\)/);
		if (match) return `COST_LESS_${match[1]}`;
	}
	if (part.includes('costEqual(')) {
		const match = part.match(/costEqual\((\d+)\)/);
		if (match) return `COST_EQUAL_${match[1]}`;
	}

	// Handle attack conditions
	if (part.includes('attackGreaterThan(')) {
		const match = part.match(/attackGreaterThan\((\d+)\)/);
		if (match) return `ATTACK_MORE_${match[1]}`;
	}
	if (part.includes('attackLessThan(')) {
		const match = part.match(/attackLessThan\((\d+)\)/);
		if (match) return `ATTACK_LESS_${match[1]}`;
	}
	if (part.includes('attackEqual(')) {
		const match = part.match(/attackEqual\((\d+)\)/);
		if (match) return `ATTACK_EQUAL_${match[1]}`;
	}

	// Handle health conditions
	if (part.includes('healthGreaterThan(')) {
		const match = part.match(/healthGreaterThan\((\d+)\)/);
		if (match) return `HEALTH_MORE_${match[1]}`;
	}
	if (part.includes('healthLessThan(')) {
		const match = part.match(/healthLessThan\((\d+)\)/);
		if (match) return `HEALTH_LESS_${match[1]}`;
	}
	if (part.includes('healthEqual(')) {
		const match = part.match(/healthEqual\((\d+)\)/);
		if (match) return `HEALTH_EQUAL_${match[1]}`;
	}

	// Handle special card IDs or functions that we might not recognize yet
	if (part.includes('CardIds.') || part.includes('cardIs(')) {
		// Skip specific card ID references for now
		return null;
	}

	// Log unknown conditions for debugging
	if (part.length > 0 && !part.match(/^\s*$/)) {
		console.log(`⚠️  Unknown condition: "${part}"`);
	}

	// Skip unknown conditions for now
	return null;
}

function expandOrConditions(orConditions: string[]): string[] {
	const results: string[] = [];

	for (const orCondition of orConditions) {
		// Extract content from or(...)
		if (orCondition.startsWith('or(') && orCondition.endsWith(')')) {
			const content = orCondition.slice(3, -1);
			const orParts = smartSplit(content, ',');

			for (const orPart of orParts) {
				const trimmed = orPart.trim();

				// Check if this is already a processed condition (from function analysis)
				if (
					trimmed.toUpperCase() === trimmed &&
					(trimmed.includes('_') || ['WEAPON', 'SPELL', 'MINION', 'LOCATION'].includes(trimmed))
				) {
					// This looks like an already processed condition
					results.push(trimmed);
				} else {
					const condition = convertToConditionString(trimmed);
					if (condition) {
						results.push(condition);
					}
				}
			}
		}
	}

	return results;
}

// Step 2: Create flat mapping and save to file
function createFlatMapping(conditionMappings: ConditionMapping[]): void {
	const flatMappings: { [condition: string]: string[] } = {};

	for (const mapping of conditionMappings) {
		for (const condition of mapping.conditions) {
			if (!flatMappings[condition]) {
				flatMappings[condition] = [];
			}
			flatMappings[condition].push(mapping.cardId);
		}
	}

	// Sort and deduplicate
	for (const condition in flatMappings) {
		flatMappings[condition] = [...new Set(flatMappings[condition])].sort();
	}

	// Save to file
	const outputPath = path.join(__dirname, 'flat-condition-mappings.json');
	fs.writeFileSync(outputPath, JSON.stringify(flatMappings, null, 2), 'utf8');

	console.log(`📁 Flat mappings saved to: ${outputPath}`);
	console.log(`📊 Found ${Object.keys(flatMappings).length} unique conditions`);

	// Print summary
	console.log('\n📋 Condition Summary:');
	for (const [condition, cards] of Object.entries(flatMappings)) {
		console.log(`  ${condition}: ${cards.length} cards`);
	}
}

// Step 3: Generate reverse selector files
function generateReverseFiles(flatMappings: { [condition: string]: string[] }): void {
	const files: { [filename: string]: string } = {};

	// Generate minion file
	files['reverse-minion-selectors.ts'] = generateMinionFile(flatMappings);

	// Generate spell file
	files['reverse-spell-selectors.ts'] = generateSpellFile(flatMappings);

	// Generate general file
	files['reverse-general-selectors.ts'] = generateGeneralFile(flatMappings);

	// Generate main entry file
	files['reverse-card-id-selectors.ts'] = generateMainFile();

	// Write all files
	for (const [filename, content] of Object.entries(files)) {
		const outputPath = path.join(__dirname, filename);
		fs.writeFileSync(outputPath, content, 'utf8');
		console.log(`✅ Generated: ${filename}`);
	}
}

function generateMinionFile(flatMappings: { [condition: string]: string[] }): string {
	const lines: string[] = [];

	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
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

	// Generate conditions for minion-related mappings, ordered by specificity (most specific first)
	const minionConditions = Object.entries(flatMappings)
		.filter(([condition]) => {
			const matches =
				condition.includes('MINION') ||
				(condition.includes('BEAST') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('MECH') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('DRAGON') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('MURLOC') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('PIRATE') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('DEMON') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('ELEMENTAL') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('UNDEAD') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('NAGA') && !condition.includes('HAS_MECHANIC')) ||
				(condition.includes('TOTEM') && !condition.includes('HAS_MECHANIC')) ||
				condition.includes('ATTACK') ||
				condition.includes('NOT_TRIBELESS');

			return matches;
		})
		.sort(([a], [b]) => {
			// Sort by specificity: more conditions = more specific = should come first
			const aConditionCount = a.split(' + ').length;
			const bConditionCount = b.split(' + ').length;

			// More specific conditions (more parts) come first
			if (aConditionCount !== bConditionCount) {
				return bConditionCount - aConditionCount;
			}

			// If same number of conditions, prioritize non-generic ones
			const aIsGeneric = a === 'MINION';
			const bIsGeneric = b === 'MINION';

			if (aIsGeneric && !bIsGeneric) return 1; // b comes first
			if (!aIsGeneric && bIsGeneric) return -1; // a comes first

			// Otherwise alphabetical
			return a.localeCompare(b);
		});

	// Collect all matching card IDs from all applicable conditions
	lines.push('	const matchingCardIds: CardIds[] = [];');
	lines.push('');

	for (const [condition, cards] of minionConditions) {
		const reverseCondition = buildReverseCondition(condition);
		if (reverseCondition && cards.length > 0) {
			// For generic MINION condition, exclude cards that have more specific conditions
			let filteredCards = cards;
			if (condition === 'MINION') {
				// Get all cards that appear in more specific conditions
				const cardsInSpecificConditions = new Set<string>();
				for (const [otherCondition, otherCards] of minionConditions) {
					if (otherCondition !== 'MINION' && otherCondition.includes('MINION')) {
						// This is a more specific minion condition
						for (const cardId of otherCards) {
							cardsInSpecificConditions.add(cardId);
						}
					}
				}
				// Filter out cards that appear in more specific conditions
				filteredCards = cards.filter((cardId) => !cardsInSpecificConditions.has(cardId));
			}

			if (filteredCards.length > 0) {
				const cardsList = filteredCards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
				lines.push(`	// ${condition} (${filteredCards.length} cards)`);
				lines.push(`	if (${reverseCondition}) {`);
				lines.push(`		matchingCardIds.push(`);
				lines.push(`			${cardsList}`);
				lines.push(`		);`);
				lines.push('	}');
				lines.push('');
			}
		}
	}

	lines.push('	// Return combined selector if any matches found');
	lines.push('	if (matchingCardIds.length > 0) {');
	lines.push('		return and(side(inputSide), or(inDeck, inHand), cardIs(...matchingCardIds));');
	lines.push('	}');

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateSpellFile(flatMappings: { [condition: string]: string[] }): string {
	const lines: string[] = [];

	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
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

	// Generate conditions for spell-related mappings, ordered by specificity (most specific first)
	const spellConditions = Object.entries(flatMappings)
		.filter(
			([condition]) =>
				condition.includes('SPELL') ||
				condition.includes('HOLY') ||
				condition.includes('FROST') ||
				condition.includes('FIRE') ||
				condition.includes('NATURE') ||
				condition.includes('SHADOW') ||
				condition.includes('FEL') ||
				condition.includes('ARCANE') ||
				condition.includes('SECRET'),
		)
		.sort(([a], [b]) => {
			// Sort by specificity: more conditions = more specific = should come first
			const aConditionCount = a.split(' + ').length;
			const bConditionCount = b.split(' + ').length;

			// More specific conditions (more parts) come first
			if (aConditionCount !== bConditionCount) {
				return bConditionCount - aConditionCount;
			}

			// If same number of conditions, prioritize non-generic ones
			const aIsGeneric = a === 'SPELL';
			const bIsGeneric = b === 'SPELL';

			if (aIsGeneric && !bIsGeneric) return 1; // b comes first
			if (!aIsGeneric && bIsGeneric) return -1; // a comes first

			// Otherwise alphabetical
			return a.localeCompare(b);
		});

	// Collect all matching card IDs from all applicable conditions
	lines.push('	const matchingCardIds: CardIds[] = [];');
	lines.push('');

	for (const [condition, cards] of spellConditions) {
		const reverseCondition = buildReverseCondition(condition);
		if (reverseCondition && cards.length > 0) {
			// For generic SPELL condition, exclude cards that have more specific conditions
			let filteredCards = cards;
			if (condition === 'SPELL') {
				// Get all cards that appear in more specific conditions
				const cardsInSpecificConditions = new Set<string>();
				for (const [otherCondition, otherCards] of spellConditions) {
					if (
						otherCondition !== 'SPELL' &&
						(otherCondition.includes('SPELL') || // Compound conditions like "HOLY + SPELL"
							otherCondition === 'HOLY' || // Separate spell school conditions
							otherCondition === 'SHADOW' ||
							otherCondition === 'FROST' ||
							otherCondition === 'FIRE' ||
							otherCondition === 'NATURE' ||
							otherCondition === 'FEL' ||
							otherCondition === 'ARCANE')
					) {
						// This is a more specific spell condition
						for (const cardId of otherCards) {
							cardsInSpecificConditions.add(cardId);
						}
					}
				}
				// Filter out cards that appear in more specific conditions
				filteredCards = cards.filter((cardId) => !cardsInSpecificConditions.has(cardId));
			}

			if (filteredCards.length > 0) {
				const cardsList = filteredCards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
				lines.push(`	// ${condition} (${filteredCards.length} cards)`);
				lines.push(`	if (${reverseCondition}) {`);
				lines.push(`		matchingCardIds.push(`);
				lines.push(`			${cardsList}`);
				lines.push(`		);`);
				lines.push('	}');
				lines.push('');
			}
		}
	}

	lines.push('	// Return combined selector if any matches found');
	lines.push('	if (matchingCardIds.length > 0) {');
	lines.push('		return and(side(inputSide), or(inDeck, inHand), cardIs(...matchingCardIds));');
	lines.push('	}');

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateGeneralFile(flatMappings: { [condition: string]: string[] }): string {
	const lines: string[] = [];

	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * GENERAL REVERSE SYNERGIES');
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

	// Generate conditions for general mappings, ordered by specificity (most specific first)
	const generalConditions = Object.entries(flatMappings)
		.filter(([condition]) => {
			const matches =
				condition.includes('WEAPON') ||
				condition.includes('LOCATION') ||
				condition.includes('COST_') ||
				condition.includes('LEGENDARY') ||
				condition.includes('NEUTRAL') ||
				condition.includes('DEATHRATTLE') ||
				condition.includes('BATTLECRY') ||
				condition.includes('TAUNT') ||
				condition.includes('RUSH');

			return matches;
		})
		.sort(([a], [b]) => {
			// Sort by specificity: more conditions = more specific = should come first
			const aConditionCount = a.split(' + ').length;
			const bConditionCount = b.split(' + ').length;

			// More specific conditions (more parts) come first
			if (aConditionCount !== bConditionCount) {
				return bConditionCount - aConditionCount;
			}

			// Otherwise alphabetical
			return a.localeCompare(b);
		});

	// Collect all matching card IDs from all applicable conditions
	lines.push('	const matchingCardIds: CardIds[] = [];');
	lines.push('');

	for (const [condition, cards] of generalConditions) {
		const reverseCondition = buildReverseCondition(condition);
		if (reverseCondition && cards.length > 0) {
			const cardsList = cards.map((id) => `CardIds.${id}`).join(',\n\t\t\t');
			lines.push(`	// ${condition} (${cards.length} cards)`);
			lines.push(`	if (${reverseCondition}) {`);
			lines.push(`		matchingCardIds.push(`);
			lines.push(`			${cardsList}`);
			lines.push(`		);`);
			lines.push('	}');
			lines.push('');
		}
	}

	lines.push('	// Return combined selector if any matches found');
	lines.push('	if (matchingCardIds.length > 0) {');
	lines.push('		return and(side(inputSide), or(inDeck, inHand), cardIs(...matchingCardIds));');
	lines.push('	}');

	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function generateMainFile(): string {
	const lines: string[] = [];

	lines.push('/**');
	lines.push(' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
	lines.push(' * Generated by build-reverse-mappings.ts');
	lines.push(' * MAIN ENTRY POINT FOR REVERSE SYNERGIES');
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
	lines.push('	// Try general selectors');
	lines.push('	const generalResult = reverseGeneralSelector(cardId, card, inputSide, allCards);');
	lines.push('	if (generalResult) return generalResult;');
	lines.push('');
	lines.push('	return null;');
	lines.push('};');

	return lines.join('\n');
}

function buildReverseCondition(condition: string): string | null {
	const parts = condition.split(' + ').map((p) => p.trim());
	const conditions: string[] = [];

	for (const part of parts) {
		switch (part) {
			case 'MINION':
				conditions.push("refCard.type?.toUpperCase() === 'MINION'");
				break;
			case 'SPELL':
				conditions.push("refCard.type?.toUpperCase() === 'SPELL'");
				break;
			case 'WEAPON':
				conditions.push("refCard.type?.toUpperCase() === 'WEAPON'");
				break;
			case 'LOCATION':
				conditions.push("refCard.type?.toUpperCase() === 'LOCATION'");
				break;
			case 'BEAST':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('BEAST')");
				break;
			case 'MECH':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('MECH')");
				break;
			case 'DRAGON':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('DRAGON')");
				break;
			case 'MURLOC':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('MURLOC')");
				break;
			case 'PIRATE':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('PIRATE')");
				break;
			case 'DEMON':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('DEMON')");
				break;
			case 'ELEMENTAL':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('ELEMENTAL')");
				break;
			case 'UNDEAD':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('UNDEAD')");
				break;
			case 'NAGA':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('NAGA')");
				break;
			case 'TOTEM':
				conditions.push("refCard.races?.map(r => r.toUpperCase()).includes('TOTEM')");
				break;
			case 'HOLY':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'HOLY'");
				break;
			case 'FROST':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'FROST'");
				break;
			case 'FIRE':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'FIRE'");
				break;
			case 'NATURE':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'NATURE'");
				break;
			case 'SHADOW':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'SHADOW'");
				break;
			case 'FEL':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'FEL'");
				break;
			case 'ARCANE':
				conditions.push("refCard.spellSchool?.toUpperCase() === 'ARCANE'");
				break;
			case 'NOT_TRIBELESS':
				conditions.push('refCard.races && refCard.races.length > 0');
				break;
			case 'LEGENDARY':
				conditions.push("refCard.rarity?.toUpperCase() === 'LEGENDARY'");
				break;
			case 'NEUTRAL':
				conditions.push("refCard.classes?.includes('NEUTRAL')");
				break;
			default:
				if (part.startsWith('COST_MORE_')) {
					const value = part.replace('COST_MORE_', '');
					conditions.push(`refCard.cost > ${value}`);
				} else if (part.startsWith('COST_LESS_')) {
					const value = part.replace('COST_LESS_', '');
					conditions.push(`refCard.cost < ${value}`);
				} else if (part.startsWith('COST_EQUAL_')) {
					const value = part.replace('COST_EQUAL_', '');
					conditions.push(`refCard.cost === ${value}`);
				} else if (part.startsWith('ATTACK_MORE_')) {
					const value = part.replace('ATTACK_MORE_', '');
					conditions.push(`refCard.attack > ${value}`);
				} else if (part.startsWith('HAS_MECHANIC_')) {
					const mechanicName = part.replace('HAS_MECHANIC_', '');
					conditions.push(`refCard.mechanics?.includes('${mechanicName}')`);
				} else {
					// Skip unknown conditions
					return null;
				}
				break;
		}
	}

	return conditions.length > 0 ? conditions.join(' && ') : null;
}

// Function to get all card IDs from the original file
function getAllOriginalCardIds(): string[] {
	const selectorsFilePath = path.join(__dirname, '..', 'card-id-selectors.ts');
	const content = fs.readFileSync(selectorsFilePath, 'utf8');

	// Find all case statements
	const caseMatches = content.match(/case\s+CardIds\.([^:]+):/g);
	if (!caseMatches) {
		return [];
	}

	return caseMatches
		.map((match) => {
			const cardIdMatch = match.match(/case\s+CardIds\.([^:]+):/);
			return cardIdMatch ? cardIdMatch[1] : '';
		})
		.filter((id) => id.length > 0);
}

// Function to analyze missing cards
function analyzeMissingCards(conditionMappings: ConditionMapping[]): void {
	const allOriginalCards = getAllOriginalCardIds();
	const processedCards = new Set(conditionMappings.map((m) => m.cardId));
	const missingCards = allOriginalCards.filter((cardId) => !processedCards.has(cardId));

	console.log(`\n🔍 Missing Cards Analysis:`);
	console.log(`📊 Total cards in original file: ${allOriginalCards.length}`);
	console.log(`✅ Cards processed successfully: ${processedCards.size}`);
	console.log(`❌ Cards missing: ${missingCards.length}`);

	if (missingCards.length > 0) {
		console.log(`\n📋 Missing cards (first 20):`);
		for (const cardId of missingCards.slice(0, 20)) {
			console.log(`  - ${cardId}`);
		}
		if (missingCards.length > 20) {
			console.log(`  ... and ${missingCards.length - 20} more`);
		}

		// Analyze reasons for missing cards
		analyzeMissingReasons(missingCards);

		// Save missing cards to file
		const missingCardsData = {
			totalOriginal: allOriginalCards.length,
			totalProcessed: processedCards.size,
			totalMissing: missingCards.length,
			missingCards: missingCards,
			analysisDate: new Date().toISOString(),
		};

		const outputPath = path.join(__dirname, 'missing-cards-analysis.json');
		fs.writeFileSync(outputPath, JSON.stringify(missingCardsData, null, 2), 'utf8');
		console.log(`\n📁 Missing cards analysis saved to: ${outputPath}`);
	}
}

// Function to analyze reasons why cards are missing
function analyzeMissingReasons(missingCards: string[]): void {
	const selectorsFilePath = path.join(__dirname, '..', 'card-id-selectors.ts');
	const content = fs.readFileSync(selectorsFilePath, 'utf8');

	const reasons = {
		complex: [] as string[],
		noReturn: [] as string[],
		highlightConditions: [] as string[],
		inputParameter: [] as string[],
		tooltip: [] as string[],
		tooLong: [] as string[],
		other: [] as string[],
	};

	for (const cardId of missingCards.slice(0, 50)) {
		// Analyze first 50 missing cards
		// Find the case for this card
		const caseRegex = new RegExp(
			`case\\s+CardIds\\.${cardId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:[\\s\\S]*?(?=case\\s+CardIds\\.|default:|$)`,
			'g',
		);
		const caseMatch = content.match(caseRegex);

		if (caseMatch && caseMatch[0]) {
			const caseContent = caseMatch[0];
			const returnMatch = caseContent.match(/return\s+(.*?);/s);

			if (!returnMatch) {
				reasons.noReturn.push(cardId);
			} else {
				const selectorCode = returnMatch[1].replace(/\s+/g, ' ').trim();

				if (selectorCode.includes('input:') || selectorCode.includes('(input: SelectorInput)')) {
					reasons.inputParameter.push(cardId);
				} else if (selectorCode.includes('highlightConditions')) {
					reasons.highlightConditions.push(cardId);
				} else if (selectorCode.includes('tooltip')) {
					reasons.tooltip.push(cardId);
				} else if (selectorCode.length > 800) {
					reasons.tooLong.push(cardId);
				} else {
					reasons.other.push(cardId);
				}
			}
		} else {
			reasons.other.push(cardId);
		}
	}

	console.log(`\n🔍 Reasons for missing cards (sample of ${Math.min(50, missingCards.length)}):`);
	if (reasons.inputParameter.length > 0) {
		console.log(
			`  🚫 Complex input parameter selectors: ${reasons.inputParameter.length} cards (excluded by design)`,
		);
		console.log(`    Examples: ${reasons.inputParameter.slice(0, 3).join(', ')}`);
	}
	if (reasons.highlightConditions.length > 0) {
		console.log(
			`  📋 Uses highlightConditions: ${reasons.highlightConditions.length} cards (should be processable)`,
		);
		console.log(`    Examples: ${reasons.highlightConditions.slice(0, 3).join(', ')}`);
	}
	if (reasons.tooltip.length > 0) {
		console.log(`  📋 Uses tooltip: ${reasons.tooltip.length} cards`);
		console.log(`    Examples: ${reasons.tooltip.slice(0, 3).join(', ')}`);
	}
	if (reasons.tooLong.length > 0) {
		console.log(`  📋 Too long (>800 chars): ${reasons.tooLong.length} cards`);
		console.log(`    Examples: ${reasons.tooLong.slice(0, 3).join(', ')}`);
	}
	if (reasons.noReturn.length > 0) {
		console.log(`  📋 No return statement: ${reasons.noReturn.length} cards`);
		console.log(`    Examples: ${reasons.noReturn.slice(0, 3).join(', ')}`);
	}
	if (reasons.other.length > 0) {
		console.log(`  📋 Other reasons: ${reasons.other.length} cards`);
		console.log(`    Examples: ${reasons.other.slice(0, 3).join(', ')}`);
	}
}

// Main execution
async function main() {
	console.log('🔍 Step 1: Extracting card conditions...');
	const conditionMappings = extractCardConditions();
	console.log(`📊 Extracted conditions for ${conditionMappings.length} cards`);

	// Debug: show first few examples
	console.log('\n🔍 Debug: First 5 extracted conditions:');
	for (const mapping of conditionMappings.slice(0, 5)) {
		console.log(`  ${mapping.cardId}: ${mapping.conditions.join(', ')}`);
	}

	// Analyze missing cards
	analyzeMissingCards(conditionMappings);

	console.log('\n📁 Step 2: Creating flat mapping...');
	createFlatMapping(conditionMappings);

	console.log('\n🔧 Step 3: Generating reverse selector files...');
	const flatMappingsPath = path.join(__dirname, 'flat-condition-mappings.json');
	const flatMappings = JSON.parse(fs.readFileSync(flatMappingsPath, 'utf8'));
	generateReverseFiles(flatMappings);

	console.log('\n✅ Reverse synergies generation complete!');
}

if (require.main === module) {
	main().catch(console.error);
}
