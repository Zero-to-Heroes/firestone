import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { cardIdSelector } from './card-id-selectors';
import { SelectorInput } from './cards-highlight-common.service';

describe('cardIdSelector', () => {
	it('highlights Rush minions in deck for Athletic Studies', () => {
		const allCards = {
			getCard: (id: string) =>
				({
					id,
					type: 'Minion',
					mechanics: id === CardIds.KorkronEliteLegacy ? [GameTag[GameTag.RUSH]] : [],
				}) as any,
		} as CardsFacadeService;
		const selector = cardIdSelector(CardIds.AthleticStudies_SCH_237, null, null, 'player', allCards);

		const rushInput = buildInput(CardIds.KorkronEliteLegacy, 'deck', allCards);
		const nonRushInput = buildInput(CardIds.MurlocRaiderLegacy, 'deck', allCards);
		const wrongZoneRushInput = buildInput(CardIds.KorkronEliteLegacy, 'hand', allCards);

		expect(selector?.(rushInput as SelectorInput)).toBeTruthy();
		expect(selector?.(nonRushInput as SelectorInput)).toBeFalsy();
		expect(selector?.(wrongZoneRushInput as SelectorInput)).toBeFalsy();
	});
});

const buildInput = (cardId: string, zone: string, allCards: CardsFacadeService): Partial<SelectorInput> => {
	const deckCard = DeckCard.create({
		cardId,
		entityId: 1,
		zone: zone === 'deck' ? ('PLAY' as const) : ('HAND' as const),
	});
	return {
		side: 'player',
		entityId: 1,
		internalEntityId: 'test',
		cardId,
		zone,
		card: allCards.getCard(cardId) as any,
		deckState: DeckState.create({}),
		deckCard,
		allCards,
	};
};
