import { ReferenceCard } from '@firestone-hs/reference-data';
import { analyzeTooltipTribes } from './menagerie';

// Helper function to create mock ReferenceCard with tribes
const createMinionWithTribes = (races: string[], name: string = 'TestMinion'): ReferenceCard =>
	({
		id: name,
		name,
		type: 'Minion' as const,
		races,
	}) as any as ReferenceCard;

// Helper function to capitalize tribe names for comparison
const capitalizeTribe = (tribe: string): string => {
	return tribe.charAt(0).toUpperCase() + tribe.slice(1);
};

interface TooltipTestCase {
	name: string;
	minions: ReferenceCard[];
	expectedSecuredTribes: string[];
	expectedFlexibleOptions: string[];
	description: string;
}

const tooltipTestCases: TooltipTestCase[] = [
	{
		name: 'Single tribes only',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['MURLOC'], 'Murloc1'),
			createMinionWithTribes(['PIRATE'], 'Pirate1'),
		],
		expectedSecuredTribes: ['Beast', 'Murloc', 'Pirate'],
		expectedFlexibleOptions: [],
		description: 'All single tribes should be secured, no flexible options',
	},
	{
		name: 'Multi-tribe with unused potential',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
		],
		expectedSecuredTribes: ['Murloc', 'Beast'],
		expectedFlexibleOptions: ['Pirate'],
		description: 'Beast + Murloc secured by algorithm, Pirate still available from dual minion',
	},
	{
		name: 'Multi-tribe becomes redundant',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['MURLOC'], 'Murloc1'),
			createMinionWithTribes(['PIRATE'], 'Pirate1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
		],
		expectedSecuredTribes: ['Beast', 'Murloc', 'Pirate'],
		expectedFlexibleOptions: [],
		description: 'All tribes secured by singles, multi-tribe has no unused potential',
	},
	{
		name: 'Partially constrained multi-tribe',
		minions: [
			createMinionWithTribes(['MURLOC'], 'Murloc1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead1'),
		],
		expectedSecuredTribes: ['Undead', 'Murloc', 'Pirate'],
		expectedFlexibleOptions: [],
		description: 'Algorithm optimally assigns all tribes, no unused potential remains',
	},
	{
		name: 'Complex optimization scenario',
		minions: [
			createMinionWithTribes(['BEAST'], 'Beast1'),
			createMinionWithTribes(['TOTEM'], 'Totem1'),
			createMinionWithTribes(['MURLOC', 'PIRATE'], 'MurlocPirate1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
		],
		expectedSecuredTribes: ['Undead', 'Murloc', 'Beast', 'Totem', 'Pirate'],
		expectedFlexibleOptions: [],
		description: 'Algorithm optimally assigns all multi-tribes, all tribes become secured',
	},
	{
		name: 'All multi-tribes exhausted',
		minions: [
			createMinionWithTribes(['ELEMENTAL'], 'Elemental1'),
			createMinionWithTribes(['UNDEAD', 'MURLOC'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead3'),
			createMinionWithTribes(['PIRATE', 'UNDEAD'], 'PirateUndead1'),
			createMinionWithTribes(['PIRATE', 'UNDEAD'], 'PirateUndead2'),
		],
		expectedSecuredTribes: ['Elemental', 'Undead', 'Murloc', 'Pirate'],
		expectedFlexibleOptions: [],
		description: 'All multi-tribe potential exhausted, everything becomes secured',
	},
	{
		name: 'complex multi-tribes',
		minions: [
			createMinionWithTribes(['ELEMENTAL'], 'Elemental1'),
			createMinionWithTribes(['UNDEAD', 'MURLOC'], 'MurlocUndead1'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead2'),
			createMinionWithTribes(['MURLOC', 'UNDEAD'], 'MurlocUndead3'),
			createMinionWithTribes(['PIRATE', 'UNDEAD'], 'PirateUndead1'),
			createMinionWithTribes(['PIRATE', 'UNDEAD'], 'PirateUndead2'),
		],
		expectedSecuredTribes: ['Elemental', 'Undead', 'Murloc', 'Pirate'],
		expectedFlexibleOptions: [],
		description:
			'There is no need to return double tribes here, as there are nothing we can play (from the already played tribes or double tribes) that would increase the number of tribes',
	},
];

// Run the tooltip tests
console.log('=== MENAGERIE TOOLTIP TESTS ===\n');

let passed = 0;
let total = tooltipTestCases.length;

for (const testCase of tooltipTestCases) {
	console.log(`🧪 ${testCase.name}`);
	console.log(`   Input: ${testCase.minions.map((m) => `${m.name}(${m.races!.join('/')})`).join(', ')}`);
	console.log(`   Description: ${testCase.description}`);

	try {
		const result = analyzeTooltipTribes(testCase.minions);

		// Convert the results to capitalized form for comparison
		const actualSecured = result.securedTribes.map(capitalizeTribe);
		const actualFlexible = result.flexibleOptions.map((option) => option.split('/').map(capitalizeTribe).join('/'));

		console.log(`   Expected secured: [${testCase.expectedSecuredTribes.join(', ')}]`);
		console.log(`   Actual secured: [${actualSecured.join(', ')}]`);
		console.log(`   Expected flexible: [${testCase.expectedFlexibleOptions.join(', ')}]`);
		console.log(`   Actual flexible: [${actualFlexible.join(', ')}]`);

		const securedMatch =
			testCase.expectedSecuredTribes.length === actualSecured.length &&
			testCase.expectedSecuredTribes.every((tribe) => actualSecured.includes(tribe));

		const flexibleMatch =
			testCase.expectedFlexibleOptions.length === actualFlexible.length &&
			testCase.expectedFlexibleOptions.every((option) => actualFlexible.includes(option));

		if (securedMatch && flexibleMatch) {
			console.log(`   ✅ PASS\n`);
			passed++;
		} else {
			console.log(`   ❌ FAIL - Tooltip tribes don't match expected\n`);
		}
	} catch (error) {
		console.log(`   💥 ERROR: ${error}\n`);
	}
}

console.log(`=== TOOLTIP RESULTS ===`);
console.log(`${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);

if (passed < total) {
	console.log('\n🔧 Tooltip logic needs fixing!');
} else {
	console.log('\n🎉 All tooltip tests passed!');
}
