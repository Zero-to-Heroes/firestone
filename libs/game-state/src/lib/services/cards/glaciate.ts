// Glaciate (AV_107 / CORE_AV_107): 6 Mana Shaman Spell (Frost)
// "Discover an 8-Cost minion. Summon and Freeze it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isGlaciateMinion = (card: ReferenceCard, currentClass: string | null | undefined) =>
	hasCorrectType(card, CardType.MINION) &&
	hasCost(card, '==', 8) &&
	canBeDiscoveredByClass(card, currentClass ?? undefined);

export const Glaciate: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Glaciate, CardIds.Glaciate_CORE_AV_107],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Glaciate.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => isGlaciateMinion(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				Glaciate.cardIds[0],
				input.allCards,
				(c: ReferenceCard) => isGlaciateMinion(c, currentClass),
				input.options,
			),
		};
	},
};
