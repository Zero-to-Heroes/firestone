/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GeneratingCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';

export const SethekkVeilweaver: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SethekkVeilweaver],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Sethekk Veilweaver generates Priest cards
		return filterCards(
			input.cardId,
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.PRIEST),
			input.inputOptions,
		);
	},
	guessInfo: () => {
		return {
			cardType: null as any, // Can be any type
			classes: [CardClass.PRIEST],
		};
	},
};
