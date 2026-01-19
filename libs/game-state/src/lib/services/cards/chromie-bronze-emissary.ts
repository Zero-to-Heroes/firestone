import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const EPOCHS: readonly string[] = [
	CardIds.Chromie_OpeningTheDarkPortalToken,
	CardIds.Chromie_BattleForMountHyjalToken,
	CardIds.Chromie_EscapeFromDurnholdeToken,
	CardIds.Chromie_CullingOfStratholmeToken,
];

// Chromie, Bronze Emissary (TOT_030)
// "Battlecry and Deathrattle: Shuffle four Historical Epochs into your deck."
export const ChromieBronzeEmissary: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_TOT_030],
	publicCreator: true,
	dynamicPool: (_input: StaticGeneratingCardInput) => {
		return EPOCHS;
	},
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: EPOCHS,
		};
	},
};
