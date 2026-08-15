import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import {
	countBoardTribes,
	DARK_DISCOVERY_GUARANTEED_TYPE_TURN,
	evaluateDarkGifts,
	filterDarkDiscoveryMinions,
	formatDarkGiftText,
	getDarkDiscoveryTiers,
	getDarkDiscoveryTurnFloor,
	getMostCommonTribes,
	giftAppliesToTurn,
	pickDarkGiftBoardCardIds,
	resolveGuaranteedTribes,
	isDarkDiscoveryMinionEligibleForTurn,
	DarkGiftGameContext,
	DarkGiftMinionView,
} from './dark-gift-rules';

const minion = (overrides: Partial<DarkGiftMinionView> & Pick<DarkGiftMinionView, 'cardId'>): DarkGiftMinionView => ({
	techLevel: 4,
	tribes: [Race.MURLOC],
	mechanics: [],
	...overrides,
});

const ctx = (overrides: Partial<DarkGiftGameContext> = {}): DarkGiftGameContext => ({
	turn: 7,
	isTenPlus: false,
	tavernTier: 4,
	availableTribes: [Race.MURLOC, Race.MECH, Race.DRAGON],
	battlecriesTriggered: 4,
	deathrattlesTriggered: 2,
	tavernSpellsCast: 3,
	...overrides,
});

describe('dark-gift-rules', () => {
	describe('getDarkDiscoveryTiers', () => {
		it('maps wiki turns to minion tiers', () => {
			expect(getDarkDiscoveryTiers(1, false)).toEqual([2]);
			expect(getDarkDiscoveryTiers(2, false)).toEqual([2]);
			expect(getDarkDiscoveryTiers(3, false)).toEqual([2]);
			expect(getDarkDiscoveryTiers(4, false)).toEqual([2, 3]);
			expect(getDarkDiscoveryTiers(5, false)).toEqual([3]);
			expect(getDarkDiscoveryTiers(6, false)).toEqual([3, 4]);
			expect(getDarkDiscoveryTiers(7, false)).toEqual([4]);
			expect(getDarkDiscoveryTiers(8, false)).toEqual([4, 5]);
			expect(getDarkDiscoveryTiers(9, false)).toEqual([4, 5, 6]);
			expect(getDarkDiscoveryTiers(10, false)).toEqual([5, 6]);
			expect(getDarkDiscoveryTiers(6, true)).toEqual([5, 6]);
		});
	});

	describe('getDarkDiscoveryTurnFloor', () => {
		it('previews turn 3 before Dark Discovery unlocks', () => {
			expect(getDarkDiscoveryTurnFloor(0)).toBe(3);
			expect(getDarkDiscoveryTurnFloor(1)).toBe(3);
			expect(getDarkDiscoveryTurnFloor(2)).toBe(3);
			expect(getDarkDiscoveryTurnFloor(3)).toBe(3);
			expect(getDarkDiscoveryTurnFloor(7)).toBe(7);
		});
	});

	describe('giftAppliesToTurn', () => {
		it('includes 11-12 gifts in the 10+ bucket', () => {
			expect(giftAppliesToTurn(12, null, 10, true)).toBe(true);
			expect(giftAppliesToTurn(11, null, 8, true)).toBe(true);
			expect(giftAppliesToTurn(3, 3, 10, true)).toBe(false);
			expect(giftAppliesToTurn(3, 3, 3, false)).toBe(true);
			expect(giftAppliesToTurn(6, 7, 8, false)).toBe(false);
		});
	});

	describe('getMostCommonTribes', () => {
		it('returns ties when counts match', () => {
			const counts = new Map<Race, number>([
				[Race.MURLOC, 3],
				[Race.MECH, 3],
				[Race.DRAGON, 1],
			]);
			expect(getMostCommonTribes(counts)).toEqual([Race.MURLOC, Race.MECH]);
		});

		it('returns a single tribe when one leads', () => {
			const counts = new Map<Race, number>([
				[Race.MURLOC, 4],
				[Race.MECH, 1],
			]);
			expect(getMostCommonTribes(counts)).toEqual([Race.MURLOC]);
		});
	});

	describe('pickDarkGiftBoardCardIds', () => {
		it('uses the live tavern board outside combat', () => {
			expect(pickDarkGiftBoardCardIds('recruit', ['elemental'], ['beast', 'beast'])).toEqual(['elemental']);
		});

		it('uses the pre-combat snapshot during combat', () => {
			expect(pickDarkGiftBoardCardIds('combat', ['survivor'], ['elemental'])).toEqual(['elemental']);
		});

		it('falls back to the snapshot when the live board is empty', () => {
			expect(pickDarkGiftBoardCardIds('recruit', [], ['elemental'])).toEqual(['elemental']);
		});
	});

	describe('resolveGuaranteedTribes', () => {
		it('prefers counted board tribes', () => {
			const counts = new Map<Race, number>([[Race.MURLOC, 1]]);
			expect(resolveGuaranteedTribes(counts, 'ELEMENTAL')).toEqual([Race.MURLOC]);
		});

		it('uses the memory composition when the board could not be counted', () => {
			expect(resolveGuaranteedTribes(new Map(), 'MURLOC')).toEqual([Race.MURLOC]);
			expect(resolveGuaranteedTribes(new Map(), 'mixed')).toEqual([]);
			expect(resolveGuaranteedTribes(new Map(), null)).toEqual([]);
		});
	});

	describe('isDarkDiscoveryMinionEligibleForTurn', () => {
		it('excludes battlecry minions before turn 5', () => {
			const battlecry = minion({
				cardId: 'bc',
				techLevel: 2,
				mechanics: [GameTag[GameTag.BATTLECRY]],
			});
			expect(isDarkDiscoveryMinionEligibleForTurn(battlecry, 3, false)).toBe(false);
			expect(isDarkDiscoveryMinionEligibleForTurn(battlecry, 5, false)).toBe(false);
			const t5Battlecry = minion({
				cardId: 'bc5',
				techLevel: 3,
				mechanics: [GameTag[GameTag.BATTLECRY]],
			});
			expect(isDarkDiscoveryMinionEligibleForTurn(t5Battlecry, 5, false)).toBe(true);
		});

		it('filters by the turn tier bucket', () => {
			const t2 = minion({ cardId: 't2', techLevel: 2 });
			expect(isDarkDiscoveryMinionEligibleForTurn(t2, 3, false)).toBe(true);
			expect(isDarkDiscoveryMinionEligibleForTurn(t2, 5, false)).toBe(false);
		});
	});

	describe('evaluateDarkGifts', () => {
		it('computes Battle Scars from live battlecries', () => {
			const gifts = evaluateDarkGifts(ctx({ turn: 6, battlecriesTriggered: 4 }), null, []);
			const scars = gifts.find((g) => g.baseId === CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28);
			expect(scars?.computedValue).toBe('+8/+8');
			expect(scars?.compatible).toBe(true);
			expect(scars?.cardId).toBe(CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28);
			expect(scars?.hasCondition).toBe(true);
			expect(scars?.condition).toBe('requires-battlecries-this-game');
			expect(scars?.reason).toBeNull();
		});

		it('uses the upgraded Battle Scars token from turn 7', () => {
			const gifts = evaluateDarkGifts(ctx({ turn: 7, battlecriesTriggered: 4 }), null, []);
			const scars = gifts.find((g) => g.baseId === CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28);
			expect(scars?.computedValue).toBe('+12/+12');
			expect(scars?.cardId).toBe(CardIds.BattleScars_BattleScarsToken_BG36_MidGameEffect_000t28t);
		});

		it('greys Battle Scars when no battlecries have triggered', () => {
			const gifts = evaluateDarkGifts(ctx({ battlecriesTriggered: 0 }), null, []);
			const scars = gifts.find((g) => g.baseId === CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28);
			expect(scars?.compatible).toBe(false);
			expect(scars?.reason).toBe('requires-battlecries-this-game');
			expect(scars?.computedValue).toBe('+0/+0');
		});

		it('greys gifts that require a minion type when hovering a typeless minion', () => {
			const hovered = minion({ cardId: 'none', tribes: [] });
			const gifts = evaluateDarkGifts(ctx(), hovered, [hovered]);
			const affinity = gifts.find((g) => g.baseId === CardIds.DarkGifts_AffinityToken_BG36_MidGameEffect_000t82);
			const hostility = gifts.find(
				(g) => g.baseId === CardIds.DarkGifts_HostilityToken_BG36_MidGameEffect_000t71,
			);
			expect(affinity).toBeUndefined();
			expect(hostility?.compatible).toBe(false);
			expect(hostility?.reason).toBe('requires-minion-type');
		});

		it('restricts battlecry minions to the allowed gift set', () => {
			const hovered = minion({
				cardId: 'bc',
				techLevel: 4,
				mechanics: [GameTag[GameTag.BATTLECRY]],
			});
			const gifts = evaluateDarkGifts(ctx({ turn: 7 }), hovered, [hovered]);
			const echoing = gifts.find(
				(g) => g.baseId === CardIds.DarkGifts_EchoingVoiceToken_BG36_MidGameEffect_000t10,
			);
			const admiration = gifts.find(
				(g) => g.baseId === CardIds.DarkGifts_AdmirationToken_BG36_MidGameEffect_000t9,
			);
			expect(echoing?.compatible).toBe(true);
			expect(admiration?.compatible).toBe(false);
			expect(admiration?.reason).toBe('battlecry-gift-restriction');
		});

		it('blocks stat-gain gifts on deathrattle minions except the wiki exceptions', () => {
			const hovered = minion({
				cardId: 'dr',
				mechanics: [GameTag[GameTag.DEATHRATTLE]],
			});
			const gifts = evaluateDarkGifts(ctx({ turn: 7 }), hovered, [hovered]);
			const embrace = gifts.find(
				(g) => g.baseId === CardIds.DarkGifts_DeathsEmbraceToken_BG36_MidGameEffect_000t29,
			);
			const hostility = gifts.find(
				(g) => g.baseId === CardIds.DarkGifts_HostilityToken_BG36_MidGameEffect_000t71,
			);
			expect(embrace?.compatible).toBe(true);
			expect(hostility?.compatible).toBe(false);
			expect(hostility?.reason).toBe('deathrattle-stats-restriction');
		});

		it('greys Gilding on higher-tier minions in the current pool', () => {
			const low = minion({ cardId: 'low', techLevel: 4 });
			const high = minion({ cardId: 'high', techLevel: 5 });
			const gifts = evaluateDarkGifts(ctx({ turn: 8 }), high, [low, high]);
			const gilding = gifts.find((g) => g.baseId === CardIds.DarkGifts_GildingToken_BG36_MidGameEffect_000t14);
			expect(gilding?.compatible).toBe(false);
			expect(gilding?.reason).toBe('not-lowest-tier');
		});

		it('puts compatible gifts first when a minion is hovered', () => {
			const hovered = minion({ cardId: 'murloc', tribes: [Race.MURLOC] });
			const gifts = evaluateDarkGifts(ctx({ turn: 7 }), hovered, [hovered]);
			const firstIncompatible = gifts.findIndex((g) => !g.compatible);
			const lastCompatible = gifts.reduce((acc, g, i) => (g.compatible ? i : acc), -1);
			expect(lastCompatible).toBeLessThan(firstIncompatible);
		});
	});

	describe('formatDarkGiftText', () => {
		it('replaces +{1}/+{2} with the computed stats', () => {
			expect(formatDarkGiftText('At the end of your turn, gain +{1}/+{2}.', '+2/+2')).toBe(
				'At the end of your turn, gain +2/+2.',
			);
		});

		it('replaces a trailing ({1}) with the computed total', () => {
			expect(
				formatDarkGiftText("Has +3/+3 for each <b>Battlecry</b> you've triggered this game. ({1})", '+8/+8'),
			).toBe("Has +3/+3 for each <b>Battlecry</b> you've triggered this game. (+8/+8)");
		});

		it('does not append a value already present in the text', () => {
			expect(formatDarkGiftText('+4/+4.', '+4/+4')).toBe('+4/+4.');
		});
	});

	describe('filterDarkDiscoveryMinions', () => {
		it('keeps only the guaranteed tribe when the toggle is on', () => {
			const murloc = minion({ cardId: 'murloc', techLevel: 4, tribes: [Race.MURLOC] });
			const mech = minion({ cardId: 'mech', techLevel: 4, tribes: [Race.MECH] });
			const result = filterDarkDiscoveryMinions([murloc, mech], 7, false, {
				guaranteedTypeEnabled: true,
				showGuaranteedType: true,
				guaranteedTribes: [Race.MURLOC],
				selectedTribe: null,
			});
			expect(result.map((m) => m.cardId)).toEqual(['murloc']);
		});

		it('keeps others when the toggle is off', () => {
			const murloc = minion({ cardId: 'murloc', techLevel: 4, tribes: [Race.MURLOC] });
			const mech = minion({ cardId: 'mech', techLevel: 4, tribes: [Race.MECH] });
			const result = filterDarkDiscoveryMinions([murloc, mech], 7, false, {
				guaranteedTypeEnabled: true,
				showGuaranteedType: false,
				guaranteedTribes: [Race.MURLOC],
				selectedTribe: null,
			});
			expect(result.map((m) => m.cardId)).toEqual(['mech']);
		});

		it('excludes every tied guaranteed tribe from Others', () => {
			const murloc = minion({ cardId: 'murloc', techLevel: 4, tribes: [Race.MURLOC] });
			const mech = minion({ cardId: 'mech', techLevel: 4, tribes: [Race.MECH] });
			const dragon = minion({ cardId: 'dragon', techLevel: 4, tribes: [Race.DRAGON] });
			const result = filterDarkDiscoveryMinions([murloc, mech, dragon], 7, false, {
				guaranteedTypeEnabled: true,
				showGuaranteedType: false,
				guaranteedTribes: [Race.MURLOC, Race.MECH],
				selectedTribe: Race.MURLOC,
			});
			expect(result.map((m) => m.cardId)).toEqual(['dragon']);
		});
	});

	describe('countBoardTribes', () => {
		it('counts Race.ALL toward every lobby tribe', () => {
			const allCards = {
				getCard: (id: string) =>
					id === 'all' ? { id, races: [Race[Race.ALL]] } : { id, races: [Race[Race.MURLOC]] },
			} as any;
			const counts = countBoardTribes(['all'], [Race.MURLOC, Race.MECH], allCards, [], []);
			expect(counts.get(Race.MURLOC)).toBe(1);
			expect(counts.get(Race.MECH)).toBe(1);
		});

		it('counts a single elemental as the guaranteed tribe', () => {
			const allCards = {
				getCard: (id: string) => ({ id, races: [Race[Race.ELEMENTAL]] }),
			} as any;
			const counts = countBoardTribes(['elemental'], [Race.ELEMENTAL, Race.MECH], allCards, [], []);
			expect(getMostCommonTribes(counts)).toEqual([Race.ELEMENTAL]);
		});
	});

	it('exposes the guaranteed-type turn', () => {
		expect(DARK_DISCOVERY_GUARANTEED_TYPE_TURN).toBe(6);
	});
});
