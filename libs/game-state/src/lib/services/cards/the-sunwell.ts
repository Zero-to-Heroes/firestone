/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// The Sunwell - Location: Add 3 random Paladin spells to your hand.
export const TheSunwell: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TheSunwell_RLK_590],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TheSunwell.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectClass(c, CardClass.PALADIN) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClass: CardClass.PALADIN,
			possibleCards: filterCards(
				TheSunwell.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					hasCorrectClass(c, CardClass.PALADIN) &&
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
