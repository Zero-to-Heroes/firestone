/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessCardIdInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDiscoverableDemon = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, currentClass);

export const WindowShopper: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WindowShopper_TOY_652, CardIds.WindowShopper_WindowShopperToken_TOY_652t],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		if (input.createdIndex === 0) {
			return CardIds.WindowShopper_WindowShopperToken_TOY_652t;
		}
		return null;
	},
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			input.cardId,
			input.allCards,
			(c) => isDiscoverableDemon(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
};
