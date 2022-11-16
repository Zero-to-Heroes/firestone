import { CardIds } from '@firestone-hs/reference-data';
import { CardOption } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

export const buildCardChoiceValue = (
	option: CardOption,
	state: GameState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): string => {
	switch (option.source) {
		case CardIds.GuessTheWeight:
			return guessTheWeight(option, state, allCards, i18n);
	}
};

const guessTheWeight = (
	option: CardOption,
	state: GameState,
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): string => {
	const lastDrawnCard = state.playerDeck.hand[state.playerDeck.hand.length - 1];
	const costOfLastDrawnCard = lastDrawnCard?.getEffectiveManaCost();
	if (costOfLastDrawnCard == null) {
		return null;
	}

	// Don't show any information if there are some unknowns in the deck
	const hasCardWithoutCostInDeck = state.playerDeck.deck.some((c) => c.getEffectiveManaCost() == null);
	if (hasCardWithoutCostInDeck) {
		return null;
	}

	switch (option.cardId) {
		case CardIds.GuessTheWeight_Less:
			const cardsCostingLess = state.playerDeck.deck.filter((c) => c.getEffectiveManaCost() < costOfLastDrawnCard)
				.length;
			return buildPercents((100 * cardsCostingLess) / state.playerDeck.deck.length);
		case CardIds.GuessTheWeight_More:
			const cardsCostingMore = state.playerDeck.deck.filter((c) => c.getEffectiveManaCost() > costOfLastDrawnCard)
				.length;
			return buildPercents((100 * cardsCostingMore) / state.playerDeck.deck.length);
	}
	return null;
};

const buildPercents = (value: number): string => {
	return value == null ? '-' : value.toFixed(1) + '%';
};
