import { CardIds } from '@firestone-hs/reference-data';
import { SelectorSort } from './cards-highlight-common.service';

export const cardIdSelectorSort = (cardId: string): SelectorSort | null => {
	switch (cardId) {
		case CardIds.TheGalacticProjectionOrb_TOY_378:
			return (a, b) => a.deckCard.refManaCost - b.deckCard.refManaCost;
	}
	return null;
};
