import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

const DK_BLOOD_HAND = ['RLK_071', 'RLK_051', 'RLK_125', 'RLK_741', 'RLK_720', 'RLK_706', 'RLK_730', 'RLK_087'];
const DK_FROST_HAND = ['RLK_042', 'RLK_025', 'RLK_015', 'RLK_223', 'RLK_512', 'RLK_063', 'RLK_713', 'TSC_052'];
const DK_UNHOLY_HAND = ['RLK_062', 'RLK_061', 'RLK_018', 'RLK_225', 'RLK_958', 'TSC_069', 'RLK_970', 'RLK_707'];
const DEMONHUNTER_HAND = [
	'TOY_400t3',
	'TOY_401t',
	'TOY_400t6',
	'TOY_400t5',
	'TOY_400t4',
	'TOY_400t7',
	'TOY_401t2',
	'TOY_400t8',
];
const DRUID_HAND = ['EX1_161', 'CORE_ICC_054', 'GIL_198', 'LOOT_392', 'LOOT_541', 'ICC_832', 'LOOT_054', 'LOOT_051'];
const MAGE_HAND = [
	'EX1_295',
	'CS2_029',
	'CS2_031',
	'CS2_026',
	'EX1_559',
	'CORE_NEW1_021',
	'CS2_024',
	'CORE_VAN_EX1_561',
];
const HUNTER_HAND = [
	'EX1_610',
	'EX1_533',
	'CORE_EX1_611',
	'CORE_KAR_006',
	'LOOT_080',
	'ICC_828',
	'LOOT_079',
	'CORE_KAR_004',
];
const PALADIN_HAND = ['BT_334', 'SCH_248', 'BT_026', 'BT_025', 'YOP_011', 'BT_024', 'BT_020', 'BT_011'];
const PRIEST_HAND = ['DRG_660', 'DRG_660', 'DRG_246', 'BT_198', 'DRG_050', 'DRG_099', 'DRG_242', 'DRG_303', 'DRG_300'];
const SHAMAN_HAND = [
	'GIL_820',
	'CORE_ICC_466',
	'CORE_GIL_622',
	'CORE_LOOT_516',
	'LOOT_373',
	'CORE_UNG_205',
	'LOOT_358',
	'UNG_025',
];
const ROGUE_HAND = ['LOE_077', 'BRM_007', 'GVG_069', 'EX1_144', 'EX1_145', 'VAN_NEW1_004', 'EX1_049', 'EX1_050'];
const WARRIOR_HAND = [
	'BRM_028',
	'CORE_EX1_604',
	'BRM_019',
	'EX1_607',
	'CORE_CS2_108',
	'FP1_021',
	'CORE_EX1_084',
	'EX1_400',
];
const WARLOCK_HAND = [
	'CORE_EX1_564',
	'LOOT_420',
	'LOOT_368',
	'CORE_ICC_041',
	'ICC_831',
	'LOOT_161',
	'LOOT_017',
	'EX1_310',
];
export const ALL_HANDS = [
	DK_BLOOD_HAND,
	DK_FROST_HAND,
	DK_UNHOLY_HAND,
	DEMONHUNTER_HAND,
	DRUID_HAND,
	MAGE_HAND,
	HUNTER_HAND,
	PALADIN_HAND,
	PRIEST_HAND,
	SHAMAN_HAND,
	ROGUE_HAND,
	WARRIOR_HAND,
	WARLOCK_HAND,
];
let ALL_HANDS_DBFIDs = null;

export const updateHandWithStonebrewInfo = (
	playedCard: DeckCard,
	hand: readonly DeckCard[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	console.debug('[stonebrew] updating hand with stonebrew info', playedCard, hand);
	const playedCardBaseId = getBaseCardId(playedCard.cardId);
	for (const iconicHand of ALL_HANDS) {
		if (iconicHand.includes(playedCardBaseId as CardIds)) {
			console.debug(
				'[stonebrew] found iconic hand',
				iconicHand,
				playedCardBaseId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}

	// if I missed the correct ID, use the "base id" to still get something
	ALL_HANDS_DBFIDs =
		ALL_HANDS_DBFIDs ??
		ALL_HANDS.map((hand) =>
			hand.map((cardId) => allCards.getCard(cardId).counterpartCards?.[0] ?? allCards.getCard(cardId).dbfId),
		);
	const playedCardBaseDbfId =
		allCards.getCard(playedCardBaseId).counterpartCards?.[0] ?? allCards.getCard(playedCardBaseId).dbfId;
	for (const iconicHand of ALL_HANDS_DBFIDs) {
		if (iconicHand.includes(playedCardBaseDbfId)) {
			console.debug(
				'[stonebrew] found iconic hand with dbfid',
				iconicHand,
				playedCardBaseId,
				playedCardBaseDbfId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}
	console.warn('Could not find iconic hand for card', playedCardBaseId, playedCardBaseDbfId);
	return hand;
};

const newHand = (
	hand: readonly DeckCard[],
	iconicHand: readonly string[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	return hand.map((card) => {
		if (
			![CardIds.HarthStonebrew_CORE_GIFT_01, CardIds.HarthStonebrew_GIFT_01].includes(
				card.creatorCardId as CardIds,
			)
		) {
			return card;
		}
		const positionInIconicHand: number = card.creatorAdditionalInfo;
		const guessedCardId = iconicHand[positionInIconicHand];
		const refCard = allCards.getCard(guessedCardId);
		console.debug('[stonebrew] updating card', card, refCard, positionInIconicHand, iconicHand);
		return card.update({
			cardId: refCard.id,
			cardName: refCard.name,
			refManaCost: refCard.cost,
			rarity: refCard.rarity,
		});
	});
};
