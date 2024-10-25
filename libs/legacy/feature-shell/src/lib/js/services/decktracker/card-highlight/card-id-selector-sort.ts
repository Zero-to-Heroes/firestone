import { CardIds } from '@firestone-hs/reference-data';
import { SelectorSort } from './cards-highlight-common.service';

export const cardIdSelectorSort = (cardId: string): SelectorSort => {
	switch (cardId) {
		case CardIds.TheGalacticProjectionOrb_TOY_378:
			return (a, b) => a.deckCard.manaCost - b.deckCard.manaCost;
	}
};
