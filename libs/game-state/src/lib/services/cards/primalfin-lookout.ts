/* eslint-disable no-mixed-spaces-and-tabs */
// Primalfin Lookout (UNG_937): 2 Mana 3/2 Neutral Murloc minion
// "<b>Battlecry:</b> If you control another Murloc, <b>Discover</b> a Murloc."
// The minion is discovered, so it needs the canBeDiscoveredByClass filter

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const PrimalfinLookout: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PrimalfinLookout_UNG_937],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			PrimalfinLookout.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MURLOC) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			races: [Race.MURLOC],
			possibleCards: filterCards(
				PrimalfinLookout.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.MURLOC) &&
					canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
