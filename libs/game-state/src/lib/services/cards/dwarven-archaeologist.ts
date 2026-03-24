/* eslint-disable no-mixed-spaces-and-tabs */
// Dwarven Archaeologist (ULD_309): 3 Mana 3/3 Neutral minion
// "Battlecry: Discover a card. Reduce its Cost by (1)."
// The card is discovered, so it needs the canBeDiscoveredByClass filter

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDiscoverableCard = (card: ReferenceCard, currentClass: string | null | undefined) =>
	canBeDiscoveredByClass(card, currentClass ?? undefined);

export const DwarvenArchaeologist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DwarvenArchaeologist],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DwarvenArchaeologist.cardIds[0],
			input.allCards,
			(c) => isDiscoverableCard(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			possibleCards: filterCards(
				DwarvenArchaeologist.cardIds[0],
				input.allCards,
				(c) => isDiscoverableCard(c, currentClass),
				input.options,
			),
		};
	},
};
