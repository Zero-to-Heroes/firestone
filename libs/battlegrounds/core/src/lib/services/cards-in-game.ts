/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardIds,
	CardRule,
	CardRules,
	CardType,
	CustomTags,
	GameTag,
	GameType,
	getTribesForInclusion,
	isBattlegroundsDuo,
	Race,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const getAllCardsInGame = (
	availableTribes: readonly Race[],
	hasSpells: boolean,
	hasDarkmoonPrizes: boolean,
	hasTrinkets: boolean,
	gameMode: GameType,
	allCards: CardsFacadeService,
	cardRules: CardRules | null,
): readonly ReferenceCard[] => {
	const result = allCards
		.getCards()
		// Keep only minions that are in the bacon pool
		.filter((card) => card.type?.toUpperCase() !== CardType[CardType.MINION] || card.isBaconPool)
		// Exclude the placeholder trinket cards
		.filter(
			(card) =>
				![CardIds.LesserTrinketToken_BG30_Trinket_1st, CardIds.GreaterTrinket_BG30_Trinket_2nd].includes(
					card.id as CardIds,
				),
		)
		.filter((card) => card.set !== 'Vanilla')
		.filter(
			(card) =>
				(card.techLevel && card.type?.toUpperCase() !== CardType[CardType.BATTLEGROUND_TRINKET]) ||
				(hasTrinkets &&
					card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET] &&
					// Manual exclusions
					!allCards.getCard(card.id).otherTags?.includes(CustomTags[CustomTags.REMOVED_FROM_BACON_POOL])),
		)
		.filter((card) =>
			isBattlegroundsDuo(gameMode)
				? !card.mechanics?.includes(GameTag[GameTag.BG_SOLO_EXCLUSIVE])
				: !card.mechanics?.includes(GameTag[GameTag.BG_DUO_EXCLUSIVE]),
		)
		.filter((card) => !card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]))
		.filter((card) => hasDarkmoonPrizes || !card.mechanics?.includes(GameTag[GameTag.IS_DARKMOON_PRIZE]))
		// .filter((card) => !NON_BUYABLE_MINION_IDS.includes(card.id as CardIds))
		.filter((card) => {
			const isValid = isValidCardForTribes(card.id, availableTribes, allCards, cardRules);
			if (!isValid) {
				return false;
			}
			// This shouldn't be needed anymore since we have card-based rules
			// if (card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL]) {
			// 	return hasSpells && isValidBgSpellForTribes(card.id, availableTribes);
			// }
			// if (card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET]) {
			// 	return hasTrinkets && isValidTrinketForTribes(card.id, availableTribes, allCards, cardRules);
			// }
			return true;
		})
		.filter((card) => {
			if (!availableTribes?.length) {
				return true;
			}
			const tribesForCard = getTribesForInclusion(card, false);
			if (!tribesForCard.filter((t) => t !== Race.BLANK).length) {
				return true;
			}
			return tribesForCard.some((r) => isValidTribe(availableTribes, Race[r]));
		})
		.filter((card) => !card.premium); // Ignore golden
	return result;
};

const isValidTribe = (validTribes: readonly Race[], race: string): boolean => {
	const raceEnum: Race = Race[race];
	return (
		raceEnum === Race.ALL ||
		raceEnum === Race.BLANK ||
		!validTribes ||
		validTribes.length === 0 ||
		validTribes.includes(raceEnum)
	);
};

const isValidBgSpellForTribes = (cardId: string, availableTribes: readonly Race[]): boolean => {
	if (!availableTribes?.length) {
		return true;
	}

	switch (cardId) {
		case CardIds.ScavengeForParts_BG28_600:
			return availableTribes.includes(Race.MECH);
		case CardIds.CloningConch_BG28_601:
			return availableTribes.includes(Race.MURLOC);
		case CardIds.GuzzleTheGoop_BG28_602:
			return availableTribes.includes(Race.DRAGON);
		case CardIds.BoonOfBeetles_BG28_603:
			return availableTribes.includes(Race.BEAST);
		case CardIds.Butchering_BG28_604:
			return availableTribes.includes(Race.UNDEAD);
		case CardIds.SuspiciousStimulant_BG28_605:
			return availableTribes.includes(Race.ELEMENTAL);
		case CardIds.SpitescaleSpecial_BG28_606:
			return availableTribes.includes(Race.NAGA);
		case CardIds.CorruptedCupcakes_BG28_607:
			return availableTribes.includes(Race.DEMON);
		case CardIds.PlunderSeeker_BG28_609:
			return availableTribes.includes(Race.PIRATE);
		case CardIds.GemConfiscation_BG28_698:
			return availableTribes.includes(Race.QUILBOAR);
	}
	return true;
};

const isValidCardForTribes = (
	cardId: string,
	availableTribes: readonly Race[],
	allCards: CardsFacadeService,
	cardRules: CardRules | null,
): boolean => {
	const debug = cardId == 'BG31_819';
	debug && console.debug('checking card', cardId, availableTribes, cardRules);
	if (!availableTribes?.length || !cardRules) {
		debug && console.debug('no tribes, ok');
		return true;
	}

	const rule: CardRule | null = cardRules[cardId];
	if (!rule) {
		debug && console.debug('no rule, ok');
		return true;
	}

	const isBanned = rule.bgsMinionTypesRules?.bannedWithTypesInLobby?.some((bannedRace) =>
		availableTribes.includes(Race[bannedRace]),
	);
	if (isBanned) {
		debug && console.debug('banned', false);
		// console.debug(
		// 	'banned trinket',
		// 	allCards.getCard(cardId).name,
		// 	rule.bgsMinionTypesRules?.bannedWithTypesInLobby?.map((r) => Race[r]),
		// 	availableTribes.map((r) => Race[r]),
		// );
		return false;
	}

	const isRestrictionMet = !!rule.bgsMinionTypesRules?.needTypesInLobby?.length
		? rule.bgsMinionTypesRules?.needTypesInLobby?.some((neededTribe) => availableTribes.includes(Race[neededTribe]))
		: true;
	if (!isRestrictionMet) {
		debug && console.debug('not isRestrictionMet', false);
		// console.debug(
		// 	'restriction not met trinket',
		// 	allCards.getCard(cardId).name,
		// 	rule.bgsMinionTypesRules?.needTypesInLobby?.map((r) => Race[r]),
		// 	availableTribes.map((r) => Race[r]),
		// );
		return false;
	}

	debug && console.debug('ok', true);
	return true;
};
