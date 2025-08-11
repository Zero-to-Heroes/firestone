import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../models/deck-card';
import { Selector } from './cards-highlight-common.service';
import { and, cardIs, drawCard, inDeck } from './selectors';

export const cardIdSelectorForArenaDraft = (
	cardId: string,
	card: DeckCard | undefined,
	allCards: CardsFacadeService,
): Selector | null => {
	const inputSide = 'arena-draft';

	switch (cardId) {
		case CardIds.Chronochiller_TIME_617:
			return and(inDeck, drawCard);
		case CardIds.RedCard_TOY_644:
			return cardIs(CardIds.PerennialSerpent_TIME_022);
	}

	return null;
};
