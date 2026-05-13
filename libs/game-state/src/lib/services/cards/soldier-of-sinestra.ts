/* eslint-disable no-mixed-spaces-and-tabs */
// Sinestra's Wing (CATA_154t / CATA_154t1) and Soldier of Sinestra (CATA_158t)
// "When summoned, get a random spell from another class. It costs (1) less. Herald twice to upgrade."
// Since the spell is added to hand, it needs both dynamicPool and guessInfo
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SoldierOfSinestra: StaticGeneratingCard & GeneratingCard = {
	publicCreator: true,
	cardIds: [
		CardIds.Sinestra_SinestrasWingToken_CATA_154t,
		CardIds.Sinestra_SinestrasWingToken_CATA_154t1,
		CardIds.ManiacalFollower_SoldierOfSinestraToken_CATA_158t,
	],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			input.card.cardId ?? SoldierOfSinestra.cardIds[0],
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
			input.cardId,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
