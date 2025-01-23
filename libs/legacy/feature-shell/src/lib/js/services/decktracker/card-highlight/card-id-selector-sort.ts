import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { SelectorInput, SelectorSort } from './cards-highlight-common.service';

export const cardIdSelectorSort = (cardId: string): SelectorSort | null => {
	switch (cardId) {
		case CardIds.TheGalacticProjectionOrb_TOY_378:
			return (original: SelectorInput[]) =>
				original.sort((a, b) => a.deckCard.refManaCost - b.deckCard.refManaCost);
		case CardIds.JimRaynor_SC_400:
		case CardIds.Thor_ThorExplosivePayloadToken_SC_414t:
			return (original: SelectorInput[]) => {
				const starships = original.filter((selectorInput) =>
					selectorInput.allCards
						.getCard(selectorInput.deckCard.cardId)
						?.mechanics?.includes(GameTag[GameTag.STARSHIP]),
				);
				const result = starships.flatMap((starship) => [
					starship,
					...starship.deckCard.storedInformation?.cards
						?.map((c) => original.find((o) => o.deckCard.entityId === c.entityId))
						.filter((c) => !!c),
				]);
				return result;
			};
	}
	return null;
};
