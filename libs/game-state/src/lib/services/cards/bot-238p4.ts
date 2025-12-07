/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectTribe } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// TODO: Verify card mechanics - BOT_238p4 mechanics need to be confirmed
// Assuming this discovers/generates Mechs based on Boomsday theme
export const Bot238p4: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Bot238p4],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Bot238p4.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: filterCards(
				Bot238p4.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH),
				input.options,
			),
		};
	},
};
