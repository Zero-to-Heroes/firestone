/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, SpecialCaseParserCard } from './_card.type';

export const TimelessCausality: SpecialCaseParserCard = {
	cardIds: [CardIds.TimelessCausality_TIME_061],
	specialCaseParser: (deck: DeckState): DeckState => {
		const maxBottom = Math.max(
			...deck.deck.filter((c) => c.positionFromBottom != null).map((c) => c.positionFromBottom!),
		);
		const maxTop = Math.max(...deck.deck.filter((c) => c.positionFromTop != null).map((c) => c.positionFromTop!));
		// Now we reverse the order of the deck
		const newDeck = deck.deck.map((card) => {
			if (card.positionFromBottom != null) {
				return card.update({
					positionFromBottom: undefined,
					positionFromTop: maxBottom - card.positionFromBottom!,
				});
			}
			if (card.positionFromTop != null) {
				return card.update({
					positionFromTop: undefined,
					positionFromBottom: maxTop - card.positionFromTop!,
				});
			}
			return card;
		});
		return deck.update({
			deck: newDeck,
		});
	},
};
