/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Draconic Herald (TOT_316)
// "<b>Battlecry:</b> <b>Discover</b> a minion. Give it +3/+3 then put it on top of your deck."
export const DraconicHerald: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DraconicHerald],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DraconicHerald.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				DraconicHerald.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
