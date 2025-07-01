import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
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

export const relatedCardIdsSelectorSort = (
	cardId: string,
	allCards: CardsFacadeService,
): ((a: string, b: string) => number) | null => {
	switch (cardId) {
		case CardIds.HedraTheHeretic_TSC_658:
			return (a, b) => (allCards.getCard(a).cost ?? 0) - (allCards.getCard(b).cost ?? 0);
		default:
			return null;
	}
};
