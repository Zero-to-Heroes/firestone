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
		return filterCards(
			TemporalAnomaly.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectClass(c, input.inputOptions?.currentClass ? CardClass[input.inputOptions.currentClass] : null),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0];
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				TemporalAnomaly.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, currentClass ? CardClass[currentClass] : null),
				input.options,
			),
		};
	},
};
