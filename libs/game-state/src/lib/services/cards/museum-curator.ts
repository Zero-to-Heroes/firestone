/* eslint-disable no-mixed-spaces-and-tabs */
// Museum Curator (LOE_006): 2 Mana Priest minion
// "Battlecry: Discover a Deathrattle card. It costs (1) less."
// The card is discovered, so it needs the canBeDiscoveredByClass filter

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MuseumCurator: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MuseumCurator, CardIds.MuseumCurator_WON_056],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		return filterCards(
			MuseumCurator.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.DEATHRATTLE) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			mechanics: [GameTag.DEATHRATTLE],
			possibleCards: filterCards(
				MuseumCurator.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.DEATHRATTLE) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
