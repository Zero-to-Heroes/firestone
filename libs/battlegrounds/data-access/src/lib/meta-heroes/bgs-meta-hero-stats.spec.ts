import { BgsGlobalHeroStat, WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats';
import { CardIds, CardRules, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { buildHeroStats, findHeroStatInTiers } from './bgs-meta-hero-stats';
import { BgsHeroTier, BgsMetaHeroStatTier, BgsMetaHeroStatTierItem } from './meta-heroes.model';

const TERON = CardIds.TeronGorefiend_BG25_HERO_103;
const FERRYMAN = CardIds.FerrymanTeron_BG25_HERO_103_SKIN_A;
const PUTRICIDE = CardIds.ProfessorPutricide_BG25_HERO_100;

const allCards = {
	getCard: (id: string | number) =>
		({
			id: typeof id === 'string' ? id : undefined,
			name: typeof id === 'string' ? id : undefined,
		}) as ReturnType<CardsFacadeService['getCard']>,
	getService: () => allCards,
} as unknown as CardsFacadeService;

const teronCardRules: CardRules = {
	[TERON]: {
		bgsMinionTypesRules: {
			needTypesInLobby: ['BEAST', 'UNDEAD'],
			alwaysAvailableForHeroes: [CardIds.TheJailer_TB_BaconShop_HERO_702, PUTRICIDE],
		},
	},
	[PUTRICIDE]: {
		bgsMinionTypesRules: {
			needTypesInLobby: ['UNDEAD'],
			alwaysAvailableForHeroes: [CardIds.TheJailer_TB_BaconShop_HERO_702, PUTRICIDE],
		},
	},
};

const placementDistribution = [1, 2, 3, 4, 5, 6, 7, 8].map((rank) => ({
	rank,
	percentage: 12.5,
}));

const heroStat = (
	heroCardId: string,
	overrides: Partial<WithMmrAndTimePeriod<BgsGlobalHeroStat>> = {},
): WithMmrAndTimePeriod<BgsGlobalHeroStat> =>
	({
		heroCardId,
		dataPoints: 100,
		totalOffered: 200,
		totalPicked: 40,
		averagePosition: 4.2,
		conservativePositionEstimate: 4.3,
		placementDistribution,
		combatWinrate: [],
		warbandStats: [],
		tribeStats: [
			{
				tribe: Race.MECH,
				impactAveragePosition: -0.05,
				dataPoints: 40,
				dataPointsOnMissingTribe: 40,
			},
		],
		...overrides,
	}) as WithMmrAndTimePeriod<BgsGlobalHeroStat>;

const tierItem = (baseCardId: string, id = baseCardId): BgsMetaHeroStatTierItem =>
	({
		id,
		baseCardId,
		averagePosition: 4.2,
		pickrate: 0.2,
	}) as BgsMetaHeroStatTierItem;

const tier = (id: BgsHeroTier, items: readonly BgsMetaHeroStatTierItem[]): BgsMetaHeroStatTier =>
	({
		id,
		label: id,
		tooltip: id,
		items,
	}) as BgsMetaHeroStatTier;

describe('findHeroStatInTiers', () => {
	it('falls back to unfiltered Teron stats for Ferryman when tribe-filtered tiers omit him', () => {
		const filtered = [tier('C', [tierItem(CardIds.Ozumat_BG23_HERO_201)])];
		const unfiltered = [tier('C', [tierItem(TERON)])];

		const result = findHeroStatInTiers(TERON, filtered, unfiltered);

		expect(result.stat?.baseCardId).toBe(TERON);
		expect(result.stat?.averagePosition).toBe(4.2);
		expect(result.tier?.id).toBe('C');
	});

	it('matches the base hero row by baseCardId even when id is a skin', () => {
		const filtered = [tier('B', [tierItem(TERON, FERRYMAN)])];

		const result = findHeroStatInTiers(TERON, filtered);

		expect(result.stat?.id).toBe(FERRYMAN);
		expect(result.stat?.baseCardId).toBe(TERON);
	});

	it('prefers tribe-filtered stats when the offered hero is present', () => {
		const filteredItem = { ...tierItem(TERON), averagePosition: 4.0 };
		const unfilteredItem = { ...tierItem(TERON), averagePosition: 4.5 };
		const result = findHeroStatInTiers(TERON, [tier('B', [filteredItem])], [tier('C', [unfilteredItem])]);

		expect(result.stat?.averagePosition).toBe(4.0);
		expect(result.tier?.id).toBe('B');
	});
});

describe('buildHeroStats', () => {
	const lobbyWithoutBeastOrUndead = [Race.MECH, Race.DRAGON, Race.PIRATE, Race.NAGA];

	it('keeps Teron when his card-rules needTypesInLobby is minion-style and the lobby lacks Beast and Undead', () => {
		const result = buildHeroStats(
			[heroStat(TERON)],
			lobbyWithoutBeastOrUndead,
			false,
			allCards,
			'battlegrounds',
			teronCardRules,
		);

		expect(result.map((s) => s.baseCardId)).toContain(TERON);
		expect(result.find((s) => s.baseCardId === TERON)?.averagePosition).toBeCloseTo(4.15);
	});

	it('still drops a tribe-locked hero whose alwaysAvailableForHeroes includes themselves', () => {
		const result = buildHeroStats(
			[heroStat(PUTRICIDE)],
			lobbyWithoutBeastOrUndead,
			false,
			allCards,
			'battlegrounds',
			teronCardRules,
		);

		expect(result.map((s) => s.baseCardId)).not.toContain(PUTRICIDE);
	});
});
