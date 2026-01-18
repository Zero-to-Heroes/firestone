/* eslint-disable no-mixed-spaces-and-tabs */
// Worthy Expedition (ULD_136): 1 Mana Druid spell
// "<b>Discover</b> a <b>Choose One</b> card."
// The card is discovered, so it needs guessInfo with canBeDiscoveredByClass filter

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WorthyExpedition: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WorthyExpedition],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		return filterCards(
			WorthyExpedition.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			WorthyExpedition.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
};
