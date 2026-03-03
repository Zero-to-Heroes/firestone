// Charged Call: 3 Mana Shaman spell
// "Discover a 1-Cost minion and summon it. (Upgraded for each Overload card you played this game!)"

import { AllCardsService, CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { ShortCard } from '../../models/game-state';
import { canBeDiscoveredByClass, hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const countOverloadCardsPlayed = (cardsPlayed: readonly ShortCard[] | undefined, allCards: AllCardsService): number =>
	cardsPlayed?.filter((c) => allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.OVERLOAD]))?.length ?? 0;

const isChargedCallMinion = (card: ReferenceCard, targetCost: number, currentClass: string | null | undefined) =>
	hasCorrectType(card, CardType.MINION) &&
	hasCost(card, '==', targetCost) &&
	canBeDiscoveredByClass(card, currentClass ?? undefined);

export const ChargedCall: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ChargedCall],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const targetCost = 1 + countOverloadCardsPlayed(input.inputOptions.deckState.cardsPlayedThisMatch, input.allCards);
		return filterCards(
			ChargedCall.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => isChargedCallMinion(c, targetCost, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const targetCost = 1 + countOverloadCardsPlayed(input.deckState.cardsPlayedThisMatch, input.allCards);
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				ChargedCall.cardIds[0],
				input.allCards,
				(c: ReferenceCard) => isChargedCallMinion(c, targetCost, currentClass),
				input.options,
			),
		};
	},
};
