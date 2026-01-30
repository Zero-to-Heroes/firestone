/* eslint-disable no-mixed-spaces-and-tabs */
// Malorne the Waywatcher (EDR_888)
// Battlecry: Discover a Legendary Wild God. If you've Imbued your Hero Power 4 times, set its Cost to (1).
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Wild God cards that can be discovered by Malorne the Waywatcher
// This is a closed pool of Legendary Wild Gods from the relatedCardDbfIds
const WILD_GOD_CARD_IDS: readonly string[] = [
	CardIds.Ohnahra_EDR_031,
	CardIds.ForestLordCenarius_EDR_209,
	CardIds.Ursol_EDR_259,
	CardIds.Omen_EDR_421,
	CardIds.Aessina_EDR_430,
	CardIds.Goldrinn_EDR_480,
	CardIds.Ashamane_EDR_527,
	CardIds.Ursoc_EDR_819,
	CardIds.AvianaElunesChosen_EDR_895,
];

export const MalorneTheWaywatcher: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MalorneTheWaywatcher_EDR_888],
	publicCreator: true,
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: WILD_GOD_CARD_IDS,
		};
	},
	dynamicPool: (_input: StaticGeneratingCardInput) => {
		return WILD_GOD_CARD_IDS;
	},
};
