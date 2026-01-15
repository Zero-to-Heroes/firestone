/* eslint-disable no-mixed-spaces-and-tabs */
// Mechagnome Guide - Battlecry: Discover a spell. Forge: It costs (3) less.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MechagnomeGuide: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MechagnomeGuide, CardIds.MechagnomeGuide_MechagnomeGuideToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MechagnomeGuide.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				MechagnomeGuide.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
