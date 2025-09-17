import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { extractUniqueTribes } from './menagerie';

// Helper function to create mock ReferenceCard with tribes
const createMinionWithTribes = (races: string[], name: string = 'TestMinion'): ReferenceCard =>
	({
		id: name,
		name,
		type: 'Minion' as const,
		races,
	}) as any as ReferenceCard;

// Manual test runner
interface TestCase {
	name: string;
	minions: ReferenceCard[];
	expected: number;
	description?: string;
}

const testCases: TestCase[] = [
	{
		name: 'Single MURLOC/PIRATE should return 1 tribe',
		minions: [createMinionWithTribes(['MURLOC', 'PIRATE'], 'DualMinion')],
		expected: 1,
		description: 'Multi-tribe minion should contribute only 1 tribe',
	},
	{
		name: 'MURLOC + PIRATE + MURLOC/PIRATE should return 2 tribes',
		minions: [
			createMinionWithTribes(['MURLOC'], 'SingleMurloc'),
			createMinionWithTribes(['PIRATE'], 'SinglePirate'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'DualMinion'),
		],
		expected: 2,
		description: 'Single tribes are forced, dual minion is redundant',
	},
	{
		name: 'BEAST + MURLOC/PIRATE + MURLOC/UNDEAD + TOTEM should return 4 tribes',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead'),
			createMinionWithTribes(['TOTEM'], 'Totem'),
		],
		expected: 4,
		description: 'Should optimize: BEAST, TOTEM, + 2 from multi-tribe minions',
	},
	{
		name: 'BEAST + UNDEAD + MURLOC/PIRATE + MURLOC/UNDEAD should return 4 tribes',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast'),
			createMinionWithTribes(['UNDEAD'], 'Undead'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead'),
		],
		expected: 4,
		description: 'Constraint propagation: MURLOC/UNDEAD→MURLOC, MURLOC/PIRATE→PIRATE',
	},
	{
		name: 'Duplicate multi-tribe minions',
		minions: [
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
			createMinionWithTribes(['BEAST'], 'Beast'),
		],
		expected: 3,
		description: 'Two identical multi-tribe minions can pick different tribes',
	},
	{
		name: 'Three unique single tribes',
		minions: [
			createMinionWithTribes(['MURLOC'], 'Murloc1'),
			createMinionWithTribes(['PIRATE'], 'Pirate1'),
			createMinionWithTribes(['BEAST'], 'Beast1'),
		],
		expected: 3,
		description: 'Simple case: each single tribe counts',
	},
	{
		name: 'Duplicate single tribes',
		minions: [
			createMinionWithTribes(['MURLOC'], 'Murloc1'),
			createMinionWithTribes(['MURLOC'], 'Murloc2'),
			createMinionWithTribes(['PIRATE'], 'Pirate1'),
		],
		expected: 2,
		description: 'Duplicate single tribes should only count once',
	},
	{
		name: 'complex multi-tribes',
		minions: [
			createMinionWithTribes(['ALL'], 'All1'),
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
			createMinionWithTribes(['TOTEM'], 'Totem1'),
		],
		expected: 6,
		description: 'Should return ALL, BEAST, MURLOC, PIRATE, UNDEAD, TOTEM',
	},
	{
		name: 'complex multi-tribes 2',
		minions: [
			createMinionWithTribes(['ALL'], 'All1'),
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
			createMinionWithTribes(['UNDEAD', 'MURLOC'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
			createMinionWithTribes(['TOTEM'], 'Totem1'),
		],
		expected: 6,
		description: 'Should return ALL, BEAST, MURLOC, PIRATE, UNDEAD, TOTEM',
	},
];

// Run the tests
console.log('=== MENAGERIE ALGORITHM TESTS ===\n');

let passed = 0;
let total = testCases.length;

for (const testCase of testCases) {
	console.log(`🧪 ${testCase.name}`);
	console.log(`   Input: ${testCase.minions.map((m) => `${m.name}(${m.races!.join('/')})`).join(', ')}`);
	console.log(`   Expected: ${testCase.expected} tribes`);
	if (testCase.description) {
		console.log(`   Note: ${testCase.description}`);
	}

	try {
		const result = extractUniqueTribes(testCase.minions);
		const actualCount = result.length;
		const raceNames = result.map((race) => Race[race]);

		console.log(`   Actual: ${actualCount} tribes [${raceNames.join(', ')}]`);

		if (actualCount === testCase.expected) {
			console.log(`   ✅ PASS\n`);
			passed++;
		} else {
			console.log(`   ❌ FAIL - Expected ${testCase.expected}, got ${actualCount}\n`);
		}
	} catch (error) {
		console.log(`   💥 ERROR: ${error}\n`);
	}
}

console.log(`=== RESULTS ===`);
console.log(`${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);

if (passed < total) {
	console.log('\n🔧 Algorithm needs fixing!');
} else {
	console.log('\n🎉 All tests passed!');
}
