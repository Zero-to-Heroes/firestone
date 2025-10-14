import { DeckCard } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Selector } from './cards-highlight-common.service';
import { and, drawCard, inDeck } from './selectors';

export const cardIdSelectorForArenaDraft = (
	cardId: string,
	card: DeckCard | undefined,
	allCards: CardsFacadeService,
): Selector => {
	const inputSide = 'arena-draft';

	switch (cardId) {
		case TempCardIds.Chronochiller:
			return and(inDeck, drawCard);
	}

	return null;
};
