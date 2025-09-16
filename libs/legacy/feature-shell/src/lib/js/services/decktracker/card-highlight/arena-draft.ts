import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { cardIdSelectorForArenaDraft } from './card-id-selectors-for-arena-draft';
import { Selector } from './cards-highlight-common.service';
import { reverseCardIdSelector } from './tools/reverse-card-id-selectors';

export const getSelectorsForArenaDraft = (cardId: string, card: DeckCard, allCards: CardsFacadeService): Selector[] => {
	const selectors: Selector[] = [];

	// Specific standard highlights for arena draft
	const selector = cardIdSelectorForArenaDraft(cardId, card, allCards);
	if (!!selector) {
		selectors.push(selector);
		// return selector;
	}

	// Reverse synergies - what wants this card?
	const reverseSelector = reverseCardIdSelector(cardId, card, 'arena-draft', allCards);
	if (!!reverseSelector) {
		selectors.push(reverseSelector);
	}

	// More complex synergies
	// For instance:  Quest would light up when you're hovering over a minion type you don't have in your deck yet

	return selectors;
};
