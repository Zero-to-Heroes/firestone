/**
 * Dark Discovery (BG36_Button_DarkGift): Starting Turn 3, spend 3 Gold to Discover a minion with a Dark Gift.
 * 3 uses per game. Offered minion tiers scale with turn. From turn 6, one offered minion is the player's
 * most common type. Gift pairing follows https://hearthstone.wiki.gg/wiki/Battlegrounds/Dark_Gift
 */
import { CardIds, CardType, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getActualTribes } from '../tribe-utils';

export const DARK_DISCOVERY_UNLOCK_TURN = 3;
export const DARK_DISCOVERY_GUARANTEED_TYPE_TURN = 6;
export const DARK_DISCOVERY_TEN_PLUS_TURN = 10;

/** Dark Discovery starts on turn 3; earlier turns still preview that first bucket. */
export const getDarkDiscoveryTurnFloor = (currentTurn: number): number =>
	Math.max(currentTurn, DARK_DISCOVERY_UNLOCK_TURN);

export type DarkGiftReasonKey =
	| 'requires-minion-type'
	| 'requires-no-minion-type'
	| 'requires-battlecry-minion'
	| 'requires-deathrattle-minion'
	| 'requires-avenge'
	| 'requires-divine-shield'
	| 'requires-spellcraft'
	| 'requires-end-of-turn'
	| 'requires-quilboar'
	| 'requires-demon'
	| 'requires-mech'
	| 'requires-dragon'
	| 'requires-murloc'
	| 'not-taunt'
	| 'not-avenge'
	| 'not-activate'
	| 'not-beast-or-undead'
	| 'not-dragon'
	| 'not-already-venomous'
	| 'not-lowest-tier'
	| 'requires-battlecries-this-game'
	| 'requires-deathrattles-this-game'
	| 'requires-tavern-spells-this-game'
	| 'requires-tavern-tier-3'
	| 'lobby-quilboar-naga'
	| 'deathrattle-stats-restriction'
	| 'battlecry-gift-restriction'
	| 'choose-one-gift-restriction';

export interface DarkGiftGameContext {
	readonly turn: number;
	readonly isTenPlus: boolean;
	readonly tavernTier: number;
	readonly availableTribes: readonly Race[];
	readonly battlecriesTriggered: number;
	readonly deathrattlesTriggered: number;
	readonly tavernSpellsCast: number;
}

export interface DarkGiftMinionView {
	readonly cardId: string;
	readonly techLevel: number;
	readonly tribes: readonly Race[];
	readonly mechanics: readonly string[];
}

export interface EvaluatedDarkGift {
	readonly cardId: string;
	readonly baseId: string;
	readonly compatible: boolean;
	readonly reason: DarkGiftReasonKey | null;
	readonly condition: DarkGiftReasonKey | null;
	readonly hasCondition: boolean;
	readonly computedValue: string | null;
}

interface DarkGiftDefinition {
	readonly baseId: string;
	readonly cardIdForTurn: (turn: number, isTenPlus: boolean) => string;
	readonly minTurn: number;
	readonly maxTurn: number | null;
	readonly condition?: DarkGiftReasonKey;
	readonly gameReason?: (ctx: DarkGiftGameContext) => DarkGiftReasonKey | null;
	readonly minionReason?: (
		minion: DarkGiftMinionView,
		ctx: DarkGiftGameContext,
		poolMinTechLevel: number,
	) => DarkGiftReasonKey | null;
	readonly computeValue?: (ctx: DarkGiftGameContext) => string | null;
	readonly givesStats?: boolean;
	readonly battlecryChooseOneAllowed?: boolean;
}

const BATTLECRY_CHOOSE_ONE_ALLOWED_IDS: readonly string[] = [
	CardIds.DarkGifts_DoubleVisionToken_BG36_MidGameEffect_000t11,
	CardIds.DarkGifts_ReplicationToken_BG36_MidGameEffect_000t18,
	CardIds.DarkGifts_GildingToken_BG36_MidGameEffect_000t14,
	CardIds.DarkGifts_EchoingVoiceToken_BG36_MidGameEffect_000t10,
];

const STAT_GAIN_EXCEPTION_IDS: readonly string[] = [
	CardIds.DarkGifts_SharpenedSwordToken_BG36_MidGameEffect_000t74,
	CardIds.DarkGifts_DeathsEmbraceToken_BG36_MidGameEffect_000t29,
	CardIds.DeathsEmbrace_DeathsEmbraceToken_BG36_MidGameEffect_000t29t,
];

const hasMechanic = (minion: DarkGiftMinionView, tag: GameTag): boolean => {
	const name = GameTag[tag];
	return minion.mechanics.includes(name);
};

const hasMinionType = (minion: DarkGiftMinionView): boolean => {
	return minion.tribes.some((tribe) => tribe !== Race.BLANK);
};

const hasTribe = (minion: DarkGiftMinionView, tribe: Race): boolean => {
	return minion.tribes.includes(Race.ALL) || minion.tribes.includes(tribe);
};

const requiresType = (minion: DarkGiftMinionView): DarkGiftReasonKey | null =>
	hasMinionType(minion) ? null : 'requires-minion-type';

const requiresNoType = (minion: DarkGiftMinionView): DarkGiftReasonKey | null =>
	hasMinionType(minion) ? 'requires-no-minion-type' : null;

export const getDarkDiscoveryTiers = (turn: number, isTenPlus: boolean): readonly number[] => {
	const raw = isTenPlus || turn >= DARK_DISCOVERY_TEN_PLUS_TURN ? DARK_DISCOVERY_TEN_PLUS_TURN : turn;
	const bucket = Math.max(raw, DARK_DISCOVERY_UNLOCK_TURN);
	switch (bucket) {
		case 3:
			return [2];
		case 4:
			return [2, 3];
		case 5:
			return [3];
		case 6:
			return [3, 4];
		case 7:
			return [4];
		case 8:
			return [4, 5];
		case 9:
			return [4, 5, 6];
		default:
			return [5, 6];
	}
};

export const giftAppliesToTurn = (
	minTurn: number,
	maxTurn: number | null,
	turn: number,
	isTenPlus: boolean,
): boolean => {
	if (isTenPlus || turn >= DARK_DISCOVERY_TEN_PLUS_TURN) {
		const overlapsTen =
			minTurn <= DARK_DISCOVERY_TEN_PLUS_TURN && (maxTurn == null || maxTurn >= DARK_DISCOVERY_TEN_PLUS_TURN);
		return minTurn >= DARK_DISCOVERY_TEN_PLUS_TURN || overlapsTen;
	}
	return minTurn <= turn && (maxTurn == null || maxTurn >= turn);
};

export const pickDarkGiftBoardCardIds = (
	phase: string | undefined,
	liveBoardCardIds: readonly string[],
	preCombatBoardCardIds: readonly string[],
): readonly string[] => {
	if (phase === 'combat' && preCombatBoardCardIds.length) {
		return preCombatBoardCardIds;
	}
	return liveBoardCardIds.length ? liveBoardCardIds : preCombatBoardCardIds;
};

export const addBoardTribe = (counts: Map<Race, number>, race: number, availableTribes: readonly Race[]): void => {
	if (!race || race === Race.INVALID || race === Race.BLANK) {
		return;
	}
	if (race === Race.ALL) {
		for (const tribe of availableTribes) {
			counts.set(tribe, (counts.get(tribe) ?? 0) + 1);
		}
		return;
	}
	counts.set(race as Race, (counts.get(race as Race) ?? 0) + 1);
};

export const resolveGuaranteedTribes = (
	boardTribeCounts: ReadonlyMap<Race, number>,
	compositionTribe: string | null | undefined,
): readonly Race[] => {
	const fromBoard = getMostCommonTribes(boardTribeCounts);
	if (fromBoard.length) {
		return fromBoard;
	}
	if (!compositionTribe || compositionTribe === 'mixed') {
		return [];
	}
	const race = Race[compositionTribe as keyof typeof Race];
	return typeof race === 'number' && race !== Race.INVALID && race !== Race.BLANK ? [race] : [];
};

export const getMostCommonTribes = (boardTribeCounts: ReadonlyMap<Race, number>): readonly Race[] => {
	let best = 0;
	for (const count of boardTribeCounts.values()) {
		if (count > best) {
			best = count;
		}
	}
	if (best <= 0) {
		return [];
	}
	return [...boardTribeCounts.entries()]
		.filter(([, count]) => count === best)
		.map(([tribe]) => tribe)
		.sort((a, b) => a - b);
};

export const countBoardTribes = (
	boardCardIds: readonly string[],
	availableTribes: readonly Race[],
	allCards: CardsFacadeService,
	trinkets: readonly string[],
	anomalies: readonly string[],
): Map<Race, number> => {
	const counts = new Map<Race, number>();
	for (const cardId of boardCardIds) {
		const card = allCards.getCard(cardId);
		if (!card?.id) {
			continue;
		}
		const tribes = getActualTribes(card, true, trinkets, anomalies);
		if (tribes.includes(Race.ALL)) {
			for (const tribe of availableTribes) {
				counts.set(tribe, (counts.get(tribe) ?? 0) + 1);
			}
			continue;
		}
		for (const tribe of tribes) {
			if (tribe === Race.BLANK) {
				continue;
			}
			counts.set(tribe, (counts.get(tribe) ?? 0) + 1);
		}
	}
	return counts;
};

export const toDarkGiftMinionView = (
	card: ReferenceCard,
	trinkets: readonly string[],
	anomalies: readonly string[],
): DarkGiftMinionView => {
	return {
		cardId: card.id,
		techLevel: card.techLevel ?? 0,
		tribes: getActualTribes(card, true, trinkets, anomalies),
		mechanics: [...(card.mechanics ?? []), ...(card.referencedTags ?? [])],
	};
};

export const isAlwaysExcludedFromDarkDiscovery = (card: ReferenceCard): boolean => {
	const mechanics = [...(card.mechanics ?? []), ...(card.referencedTags ?? [])];
	if (mechanics.includes(GameTag[GameTag.BACON_CANT_HAVE_DARK_GIFT])) {
		return true;
	}
	if (mechanics.includes(GameTag[GameTag.MAGNETIC]) || mechanics.includes(GameTag[GameTag.MAGNETIC_TO_RACE])) {
		return true;
	}
	return false;
};

export const isDarkDiscoveryMinionEligibleForTurn = (
	minion: DarkGiftMinionView,
	turn: number,
	isTenPlus: boolean,
): boolean => {
	const tiers = getDarkDiscoveryTiers(turn, isTenPlus);
	if (!tiers.includes(minion.techLevel)) {
		return false;
	}
	const effectiveTurn = isTenPlus ? DARK_DISCOVERY_TEN_PLUS_TURN : turn;
	if (effectiveTurn < 5) {
		if (hasMechanic(minion, GameTag.BATTLECRY) || hasMechanic(minion, GameTag.CHOOSE_ONE)) {
			return false;
		}
	}
	return true;
};

const upgradedTurn = (turn: number, isTenPlus: boolean): boolean => isTenPlus || turn >= 7;

const DARK_GIFT_DEFINITIONS: readonly DarkGiftDefinition[] = [
	{
		baseId: CardIds.DarkGifts_FortitudeToken_BG36_MidGameEffect_000t73,
		cardIdForTurn: () => CardIds.DarkGifts_FortitudeToken_BG36_MidGameEffect_000t73,
		minTurn: 3,
		maxTurn: 3,
		givesStats: true,
		computeValue: () => '+4/+4',
	},
	{
		baseId: CardIds.DarkGifts_AffinityToken_BG36_MidGameEffect_000t82,
		cardIdForTurn: () => CardIds.DarkGifts_AffinityToken_BG36_MidGameEffect_000t82,
		minTurn: 3,
		maxTurn: 4,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
	},
	{
		baseId: CardIds.DarkGifts_JawsOfDeathToken_BG36_MidGameEffect_000t16,
		cardIdForTurn: () => CardIds.DarkGifts_JawsOfDeathToken_BG36_MidGameEffect_000t16,
		minTurn: 3,
		maxTurn: null,
		condition: 'requires-deathrattle-minion',
		minionReason: (minion) => (hasMechanic(minion, GameTag.DEATHRATTLE) ? null : 'requires-deathrattle-minion'),
	},
	{
		baseId: CardIds.DarkGifts_SharpenedSwordToken_BG36_MidGameEffect_000t74,
		cardIdForTurn: () => CardIds.DarkGifts_SharpenedSwordToken_BG36_MidGameEffect_000t74,
		minTurn: 3,
		maxTurn: 5,
		givesStats: true,
		condition: 'not-avenge',
		minionReason: (minion) => (hasMechanic(minion, GameTag.AVENGE) ? 'not-avenge' : null),
		computeValue: () => '+2',
	},
	{
		baseId: CardIds.DarkGifts_ToughenedShieldToken_BG36_MidGameEffect_000t75,
		cardIdForTurn: () => CardIds.DarkGifts_ToughenedShieldToken_BG36_MidGameEffect_000t75,
		minTurn: 3,
		maxTurn: 5,
		givesStats: true,
		condition: 'lobby-quilboar-naga',
		gameReason: (ctx) =>
			ctx.availableTribes.includes(Race.QUILBOAR) || ctx.availableTribes.includes(Race.NAGA)
				? 'lobby-quilboar-naga'
				: null,
		computeValue: () => '+2',
	},
	{
		baseId: CardIds.DarkGifts_SteadyGrowthToken_BG36_MidGameEffect_000t51,
		cardIdForTurn: () => CardIds.DarkGifts_SteadyGrowthToken_BG36_MidGameEffect_000t51,
		minTurn: 3,
		maxTurn: 6,
		givesStats: true,
		computeValue: (ctx) => {
			switch (ctx.turn) {
				case 3:
					return '+1/+2';
				case 4:
					return '+2/+2';
				case 5:
					return '+3/+3';
				default:
					return '+4/+4';
			}
		},
	},
	{
		baseId: CardIds.DarkGifts_SunkenPersistenceToken_BG36_MidGameEffect_000t62,
		cardIdForTurn: () => CardIds.DarkGifts_SunkenPersistenceToken_BG36_MidGameEffect_000t62,
		minTurn: 3,
		maxTurn: null,
		condition: 'requires-spellcraft',
		minionReason: (minion) =>
			hasMechanic(minion, GameTag.BACON_SPELLCRAFT) || hasMechanic(minion, GameTag.SPELLCRAFT_HINT)
				? null
				: 'requires-spellcraft',
	},
	{
		baseId: CardIds.DarkGifts_TimeTurningToken_BG36_MidGameEffect_000t21,
		cardIdForTurn: () => CardIds.DarkGifts_TimeTurningToken_BG36_MidGameEffect_000t21,
		minTurn: 3,
		maxTurn: null,
		condition: 'requires-end-of-turn',
		minionReason: (minion) =>
			hasMechanic(minion, GameTag.END_OF_TURN) || hasMechanic(minion, GameTag.END_OF_TURN_TRIGGER)
				? null
				: 'requires-end-of-turn',
	},
	{
		baseId: CardIds.DarkGifts_HarpysTalonsToken_BG36_MidGameEffect_000t13,
		cardIdForTurn: () => CardIds.DarkGifts_HarpysTalonsToken_BG36_MidGameEffect_000t13,
		minTurn: 3,
		maxTurn: null,
	},
	{
		baseId: CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28,
		cardIdForTurn: (turn, isTenPlus) =>
			upgradedTurn(turn, isTenPlus)
				? CardIds.BattleScars_BattleScarsToken_BG36_MidGameEffect_000t28t
				: CardIds.DarkGifts_BattleScarsToken_BG36_MidGameEffect_000t28,
		minTurn: 4,
		maxTurn: null,
		givesStats: true,
		condition: 'requires-battlecries-this-game',
		gameReason: (ctx) => (ctx.battlecriesTriggered > 0 ? null : 'requires-battlecries-this-game'),
		computeValue: (ctx) => {
			const per = upgradedTurn(ctx.turn, ctx.isTenPlus) ? 3 : 2;
			const value = per * ctx.battlecriesTriggered;
			return `+${value}/+${value}`;
		},
	},
	{
		baseId: CardIds.DarkGifts_DeathsEmbraceToken_BG36_MidGameEffect_000t29,
		cardIdForTurn: (turn, isTenPlus) =>
			upgradedTurn(turn, isTenPlus)
				? CardIds.DeathsEmbrace_DeathsEmbraceToken_BG36_MidGameEffect_000t29t
				: CardIds.DarkGifts_DeathsEmbraceToken_BG36_MidGameEffect_000t29,
		minTurn: 4,
		maxTurn: null,
		givesStats: true,
		condition: 'requires-deathrattles-this-game',
		gameReason: (ctx) => (ctx.deathrattlesTriggered > 0 ? null : 'requires-deathrattles-this-game'),
		computeValue: (ctx) => {
			const per = upgradedTurn(ctx.turn, ctx.isTenPlus) ? 2 : 1;
			const value = per * ctx.deathrattlesTriggered;
			return `+${value}/+${value}`;
		},
	},
	{
		baseId: CardIds.DarkGifts_SpellSiphonToken_BG36_MidGameEffect_000t30,
		cardIdForTurn: (turn, isTenPlus) =>
			upgradedTurn(turn, isTenPlus)
				? CardIds.SpellSiphon_SpellSiphonToken_BG36_MidGameEffect_000t30t
				: CardIds.DarkGifts_SpellSiphonToken_BG36_MidGameEffect_000t30,
		minTurn: 4,
		maxTurn: null,
		givesStats: true,
		condition: 'requires-tavern-spells-this-game',
		gameReason: (ctx) => (ctx.tavernSpellsCast > 0 ? null : 'requires-tavern-spells-this-game'),
		computeValue: (ctx) => {
			const per = upgradedTurn(ctx.turn, ctx.isTenPlus) ? 3 : 2;
			const value = per * ctx.tavernSpellsCast;
			return `+${value}/+${value}`;
		},
	},
	{
		baseId: CardIds.DarkGifts_ConsanguinityToken_BG36_MidGameEffect_000t80,
		cardIdForTurn: () => CardIds.DarkGifts_ConsanguinityToken_BG36_MidGameEffect_000t80,
		minTurn: 4,
		maxTurn: 5,
		condition: 'requires-quilboar',
		minionReason: (minion) => (hasTribe(minion, Race.QUILBOAR) ? null : 'requires-quilboar'),
	},
	{
		baseId: CardIds.DarkGifts_FreshPerspectiveToken_BG36_MidGameEffect_000t52,
		cardIdForTurn: () => CardIds.DarkGifts_FreshPerspectiveToken_BG36_MidGameEffect_000t52,
		minTurn: 4,
		maxTurn: 5,
	},
	{
		baseId: CardIds.DarkGifts_FurtivenessToken_BG36_MidGameEffect_000t79,
		cardIdForTurn: () => CardIds.DarkGifts_FurtivenessToken_BG36_MidGameEffect_000t79,
		minTurn: 4,
		maxTurn: null,
		condition: 'requires-avenge',
		minionReason: (minion) => (hasMechanic(minion, GameTag.AVENGE) ? null : 'requires-avenge'),
	},
	{
		baseId: CardIds.DarkGifts_GildingToken_BG36_MidGameEffect_000t14,
		cardIdForTurn: () => CardIds.DarkGifts_GildingToken_BG36_MidGameEffect_000t14,
		minTurn: 4,
		maxTurn: 8,
		battlecryChooseOneAllowed: true,
		condition: 'not-lowest-tier',
		minionReason: (minion, _ctx, poolMinTechLevel) => {
			if (
				hasMechanic(minion, GameTag.HAS_ACTIVATE_POWER) ||
				hasMechanic(minion, GameTag.BACON_ACTIVATE_TOOLTIP)
			) {
				return 'not-activate';
			}
			if (minion.techLevel > poolMinTechLevel) {
				return 'not-lowest-tier';
			}
			return null;
		},
	},
	{
		baseId: CardIds.DarkGifts_ReplicationToken_BG36_MidGameEffect_000t18,
		cardIdForTurn: () => CardIds.DarkGifts_ReplicationToken_BG36_MidGameEffect_000t18,
		minTurn: 4,
		maxTurn: 6,
		battlecryChooseOneAllowed: true,
	},
	{
		baseId: CardIds.DarkGifts_AmalgamationToken_BG36_MidGameEffect_000t22,
		cardIdForTurn: () => CardIds.DarkGifts_AmalgamationToken_BG36_MidGameEffect_000t22,
		minTurn: 5,
		maxTurn: null,
		condition: 'requires-no-minion-type',
		minionReason: (minion) => requiresNoType(minion),
	},
	{
		baseId: CardIds.DarkGifts_DoubleVisionToken_BG36_MidGameEffect_000t11,
		cardIdForTurn: () => CardIds.DarkGifts_DoubleVisionToken_BG36_MidGameEffect_000t11,
		minTurn: 5,
		maxTurn: null,
		battlecryChooseOneAllowed: true,
	},
	{
		baseId: CardIds.DarkGifts_DemonologyToken_BG36_MidGameEffect_000t66,
		cardIdForTurn: () => CardIds.DarkGifts_DemonologyToken_BG36_MidGameEffect_000t66,
		minTurn: 5,
		maxTurn: 8,
		condition: 'requires-demon',
		minionReason: (minion) => (hasTribe(minion, Race.DEMON) ? null : 'requires-demon'),
	},
	{
		baseId: CardIds.DarkGifts_MysticEssenceToken_BG36_MidGameEffect_000t5,
		cardIdForTurn: () => CardIds.DarkGifts_MysticEssenceToken_BG36_MidGameEffect_000t5,
		minTurn: 5,
		maxTurn: 8,
	},
	{
		baseId: CardIds.DarkGifts_PolarizationToken_BG36_MidGameEffect_000t65,
		cardIdForTurn: () => CardIds.DarkGifts_PolarizationToken_BG36_MidGameEffect_000t65,
		minTurn: 5,
		maxTurn: 8,
		condition: 'requires-mech',
		gameReason: (ctx) => (ctx.tavernTier < 3 ? 'requires-tavern-tier-3' : null),
		minionReason: (minion) => (hasTribe(minion, Race.MECH) ? null : 'requires-mech'),
	},
	{
		baseId: CardIds.DarkGifts_TorethsBlessingToken_BG36_MidGameEffect_000t15,
		cardIdForTurn: () => CardIds.DarkGifts_TorethsBlessingToken_BG36_MidGameEffect_000t15,
		minTurn: 5,
		maxTurn: null,
		condition: 'requires-divine-shield',
		minionReason: (minion) => (hasMechanic(minion, GameTag.DIVINE_SHIELD) ? null : 'requires-divine-shield'),
	},
	{
		baseId: CardIds.DarkGifts_DefensiveSacrificeToken_BG36_MidGameEffect_000t2,
		cardIdForTurn: () => CardIds.DarkGifts_DefensiveSacrificeToken_BG36_MidGameEffect_000t2,
		minTurn: 6,
		maxTurn: 9,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
	},
	{
		baseId: CardIds.DarkGifts_OffensiveSacrificeToken_BG36_MidGameEffect_000t,
		cardIdForTurn: () => CardIds.DarkGifts_OffensiveSacrificeToken_BG36_MidGameEffect_000t,
		minTurn: 6,
		maxTurn: 9,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
	},
	{
		baseId: CardIds.DarkGifts_DexterityToken_BG36_MidGameEffect_000t64,
		cardIdForTurn: (turn, isTenPlus) =>
			isTenPlus || turn >= 8
				? CardIds.Dexterity_DexterityToken_BG36_MidGameEffect_000t64t
				: CardIds.DarkGifts_DexterityToken_BG36_MidGameEffect_000t64,
		minTurn: 6,
		maxTurn: 10,
		givesStats: true,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
		computeValue: (ctx) => (ctx.isTenPlus || ctx.turn >= 8 ? '+4/+4' : '+2/+2'),
	},
	{
		baseId: CardIds.DarkGifts_EchoingVoiceToken_BG36_MidGameEffect_000t10,
		cardIdForTurn: () => CardIds.DarkGifts_EchoingVoiceToken_BG36_MidGameEffect_000t10,
		minTurn: 6,
		maxTurn: null,
		battlecryChooseOneAllowed: true,
		condition: 'requires-battlecry-minion',
		minionReason: (minion) => (hasMechanic(minion, GameTag.BATTLECRY) ? null : 'requires-battlecry-minion'),
	},
	{
		baseId: CardIds.DarkGifts_IncubationToken_BG36_MidGameEffect_000t4,
		cardIdForTurn: () => CardIds.DarkGifts_IncubationToken_BG36_MidGameEffect_000t4,
		minTurn: 6,
		maxTurn: 8,
		givesStats: true,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
		computeValue: () => '+2/+2',
	},
	{
		baseId: CardIds.DarkGifts_TarecgosasBlessingToken_BG36_MidGameEffect_000t50,
		cardIdForTurn: () => CardIds.DarkGifts_TarecgosasBlessingToken_BG36_MidGameEffect_000t50,
		minTurn: 6,
		maxTurn: null,
		condition: 'requires-dragon',
		minionReason: (minion) => (hasTribe(minion, Race.DRAGON) ? null : 'requires-dragon'),
	},
	{
		baseId: CardIds.DarkGifts_AdmirationToken_BG36_MidGameEffect_000t9,
		cardIdForTurn: () => CardIds.DarkGifts_AdmirationToken_BG36_MidGameEffect_000t9,
		minTurn: 7,
		maxTurn: null,
		givesStats: true,
	},
	{
		baseId: CardIds.DarkGifts_CharismaToken_BG36_MidGameEffect_000t3,
		cardIdForTurn: () => CardIds.DarkGifts_CharismaToken_BG36_MidGameEffect_000t3,
		minTurn: 7,
		maxTurn: null,
		condition: 'not-taunt',
		minionReason: (minion) => {
			if (hasMechanic(minion, GameTag.TAUNT) || hasMechanic(minion, GameTag.AVENGE)) {
				return hasMechanic(minion, GameTag.TAUNT) ? 'not-taunt' : 'not-avenge';
			}
			return null;
		},
	},
	{
		baseId: CardIds.DarkGifts_HostilityToken_BG36_MidGameEffect_000t71,
		cardIdForTurn: () => CardIds.DarkGifts_HostilityToken_BG36_MidGameEffect_000t71,
		minTurn: 7,
		maxTurn: null,
		givesStats: true,
		condition: 'requires-minion-type',
		minionReason: (minion) => {
			if (hasMechanic(minion, GameTag.AVENGE)) {
				return 'not-avenge';
			}
			return requiresType(minion);
		},
	},
	{
		baseId: CardIds.DarkGifts_ResistanceToken_BG36_MidGameEffect_000t7,
		cardIdForTurn: () => CardIds.DarkGifts_ResistanceToken_BG36_MidGameEffect_000t7,
		minTurn: 7,
		maxTurn: 10,
		givesStats: true,
		condition: 'not-beast-or-undead',
		minionReason: (minion) => {
			if (!hasMinionType(minion)) {
				return 'requires-minion-type';
			}
			if (hasTribe(minion, Race.BEAST) || hasTribe(minion, Race.UNDEAD)) {
				return 'not-beast-or-undead';
			}
			return null;
		},
	},
	{
		baseId: CardIds.DarkGifts_ToxicityToken_BG36_MidGameEffect_000t69,
		cardIdForTurn: () => CardIds.DarkGifts_ToxicityToken_BG36_MidGameEffect_000t69,
		minTurn: 7,
		maxTurn: null,
		condition: 'requires-murloc',
		minionReason: (minion) => {
			if (!hasTribe(minion, Race.MURLOC)) {
				return 'requires-murloc';
			}
			if (hasMechanic(minion, GameTag.VENOMOUS) || hasMechanic(minion, GameTag.POISONOUS)) {
				return 'not-already-venomous';
			}
			return null;
		},
	},
	{
		baseId: CardIds.DarkGifts_TranscendenceToken_BG36_MidGameEffect_000t81,
		cardIdForTurn: () => CardIds.DarkGifts_TranscendenceToken_BG36_MidGameEffect_000t81,
		minTurn: 7,
		maxTurn: null,
		givesStats: true,
		condition: 'requires-no-minion-type',
		minionReason: (minion) => requiresNoType(minion),
	},
	{
		baseId: CardIds.DarkGifts_GolemancyToken_BG36_MidGameEffect_000t61,
		cardIdForTurn: () => CardIds.DarkGifts_GolemancyToken_BG36_MidGameEffect_000t61,
		minTurn: 9,
		maxTurn: 10,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
	},
	{
		baseId: CardIds.DarkGifts_PersistingHorrorToken_BG36_MidGameEffect_000t12,
		cardIdForTurn: () => CardIds.DarkGifts_PersistingHorrorToken_BG36_MidGameEffect_000t12,
		minTurn: 10,
		maxTurn: null,
		condition: 'requires-minion-type',
		minionReason: (minion) => requiresType(minion),
	},
	{
		baseId: CardIds.DarkGifts_TitanicStrengthToken_BG36_MidGameEffect_000t72,
		cardIdForTurn: () => CardIds.DarkGifts_TitanicStrengthToken_BG36_MidGameEffect_000t72,
		minTurn: 11,
		maxTurn: null,
		givesStats: true,
		condition: 'not-dragon',
		minionReason: (minion) => (hasTribe(minion, Race.DRAGON) ? 'not-dragon' : null),
		computeValue: () => '+1000',
	},
	{
		baseId: CardIds.DarkGifts_InvulnerabilityToken_BG36_MidGameEffect_000t60,
		cardIdForTurn: () => CardIds.DarkGifts_InvulnerabilityToken_BG36_MidGameEffect_000t60,
		minTurn: 12,
		maxTurn: null,
		condition: 'requires-minion-type',
		minionReason: (minion) => {
			if (hasMechanic(minion, GameTag.TAUNT)) {
				return 'not-taunt';
			}
			return requiresType(minion);
		},
	},
];

const extraMinionReason = (def: DarkGiftDefinition, minion: DarkGiftMinionView): DarkGiftReasonKey | null => {
	const isBattlecry = hasMechanic(minion, GameTag.BATTLECRY);
	const isChooseOne = hasMechanic(minion, GameTag.CHOOSE_ONE);
	if (
		(isBattlecry || isChooseOne) &&
		!def.battlecryChooseOneAllowed &&
		!BATTLECRY_CHOOSE_ONE_ALLOWED_IDS.includes(def.baseId)
	) {
		return isChooseOne ? 'choose-one-gift-restriction' : 'battlecry-gift-restriction';
	}
	if (hasMechanic(minion, GameTag.DEATHRATTLE) && def.givesStats && !STAT_GAIN_EXCEPTION_IDS.includes(def.baseId)) {
		return 'deathrattle-stats-restriction';
	}
	return null;
};

/** Replace `{N}` script-data placeholders with the computed gift value (e.g. +{1}/+{2} → +2/+2). */
export const formatDarkGiftText = (rawText: string | null | undefined, computedValue: string | null): string | null => {
	if (!rawText) {
		return computedValue;
	}
	let text = rawText.replace(/^\[x\]/, '').replace(/\n/g, ' ');
	if (!computedValue) {
		return text;
	}
	if (/\+\{(\d+)\}\/\+\{(\d+)\}/.test(text)) {
		text = text.replace(/\+\{(\d+)\}\/\+\{(\d+)\}/g, computedValue);
	}
	const leftover = text.match(/\{\d+\}/g);
	if (leftover?.length === 1) {
		text = text.replace(/\{\d+\}/, computedValue);
	} else if (leftover?.length) {
		const nums = computedValue.match(/\d+/g) ?? [];
		let index = 0;
		text = text.replace(/\{\d+\}/g, () => nums[index++] ?? '0');
	}
	if (!text.includes(computedValue)) {
		text = `${text} (${computedValue})`;
	}
	return text;
};

export const evaluateDarkGifts = (
	ctx: DarkGiftGameContext,
	hoveredMinion: DarkGiftMinionView | null,
	visibleMinions: readonly DarkGiftMinionView[],
): readonly EvaluatedDarkGift[] => {
	const poolMinTechLevel = visibleMinions.length
		? Math.min(...visibleMinions.map((minion) => minion.techLevel))
		: Number.POSITIVE_INFINITY;
	const result: EvaluatedDarkGift[] = [];
	for (const def of DARK_GIFT_DEFINITIONS) {
		if (!giftAppliesToTurn(def.minTurn, def.maxTurn, ctx.turn, ctx.isTenPlus)) {
			continue;
		}
		const gameReason = def.gameReason?.(ctx) ?? null;
		let reason = gameReason;
		if (!reason && hoveredMinion) {
			reason =
				extraMinionReason(def, hoveredMinion) ??
				def.minionReason?.(hoveredMinion, ctx, poolMinTechLevel) ??
				null;
		}
		result.push({
			cardId: def.cardIdForTurn(ctx.turn, ctx.isTenPlus),
			baseId: def.baseId,
			compatible: reason == null,
			reason,
			condition: def.condition ?? null,
			hasCondition: !!def.condition || !!def.gameReason || !!def.minionReason,
			computedValue: def.computeValue?.(ctx) ?? null,
		});
	}
	return result.sort((a, b) => {
		if (a.compatible !== b.compatible) {
			return a.compatible ? -1 : 1;
		}
		return a.baseId.localeCompare(b.baseId);
	});
};

export const filterDarkDiscoveryMinions = (
	minions: readonly DarkGiftMinionView[],
	turn: number,
	isTenPlus: boolean,
	options: {
		readonly guaranteedTypeEnabled: boolean;
		readonly showGuaranteedType: boolean;
		readonly guaranteedTribes: readonly Race[];
		readonly selectedTribe: Race | null;
	},
): readonly DarkGiftMinionView[] => {
	const forTurn = minions.filter((minion) => isDarkDiscoveryMinionEligibleForTurn(minion, turn, isTenPlus));
	if (!options.guaranteedTypeEnabled || !options.guaranteedTribes.length) {
		return forTurn;
	}
	if (options.showGuaranteedType) {
		const targetTribes = options.selectedTribe != null ? [options.selectedTribe] : options.guaranteedTribes;
		return forTurn.filter((minion) => targetTribes.some((tribe) => hasTribe(minion, tribe)));
	}
	return forTurn.filter((minion) => !options.guaranteedTribes.some((tribe) => hasTribe(minion, tribe)));
};

export const isDarkDiscoveryPoolMinion = (card: ReferenceCard): boolean => {
	if (card.type?.toUpperCase() !== CardType[CardType.MINION]) {
		return false;
	}
	if (!card.isBaconPool) {
		return false;
	}
	if (card.premium) {
		return false;
	}
	return !isAlwaysExcludedFromDarkDiscovery(card);
};
