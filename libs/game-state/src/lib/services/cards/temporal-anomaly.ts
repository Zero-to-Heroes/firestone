/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Temporal Anomaly (TOT_334)
// "When you draw this, add a random spell to your hand (from your class)."
export const TemporalAnomaly: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TemporalAnomaly],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClassStr = input.inputOptions?.currentClass;
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
		return filterCards(
			TemporalAnomaly.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClassStr = input.deckState.hero?.classes?.[0];
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				TemporalAnomaly.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, currentClass),
				input.options,
			),
		};
	},
};
