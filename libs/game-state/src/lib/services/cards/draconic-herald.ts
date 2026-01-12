/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Draconic Herald (TOT_316)
// "<b>Battlecry:</b> <b>Discover</b> a minion. Give it +3/+3 then put it on top of your deck."
export const DraconicHerald: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DraconicHerald],
	publicCreator: true,
	publicTutor: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DraconicHerald.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			canBeDiscoveredBy: DraconicHerald.cardIds[0],
			possibleCards: filterCards(
				DraconicHerald.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION),
				input.options,
			),
		};
	},
};
