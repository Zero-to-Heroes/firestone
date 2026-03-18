/* eslint-disable no-mixed-spaces-and-tabs */
// Hipster (ETC_103) - 2 mana 1/3 Neutral Minion
// Battlecry: Discover a spell from your opponent's class that isn't in their deck.
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Hipster: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Hipster],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClassStr = input.inputOptions.opponentDeckState.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		const opponentDeckCardIds = new Set(
			input.inputOptions.opponentDeckState.deckList?.map((c) => c.cardId) ?? [],
		);
		return filterCards(
			Hipster.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectClass(c, opponentClass) &&
				hasCorrectType(c, CardType.SPELL) &&
				!opponentDeckCardIds.has(c.id),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClassStr = input.opponentDeckState?.getCurrentClass();
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr] : null;
		const opponentDeckCardIds = new Set(
			input.opponentDeckState?.deckList?.map((c) => c.cardId) ?? [],
		);
		const possibleCards = filterCards(
			Hipster.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectClass(c, opponentClass) &&
				hasCorrectType(c, CardType.SPELL) &&
				!opponentDeckCardIds.has(c.id),
			input.options,
		);
		return {
			cardClasses: opponentClass ? [opponentClass] : undefined,
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
