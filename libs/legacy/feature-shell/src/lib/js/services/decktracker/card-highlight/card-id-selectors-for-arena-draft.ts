import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Selector } from './cards-highlight-common.service';

export const cardIdSelectorForArenaDraft = (
	cardId: string,
	card: DeckCard | undefined,
	allCards: CardsFacadeService,
): Selector => {
	const inputSide = 'arena-draft';

	switch (cardId) {
	}

	return null;
};
