/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SoldierOfSinestra: StaticGeneratingCard & GeneratingCard = {
	publicCreator: true,
	cardIds: [CardIds.ManiacalFollower_SoldierOfSinestraToken_CATA_158t],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SoldierOfSinestra.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SoldierOfSinestra.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
