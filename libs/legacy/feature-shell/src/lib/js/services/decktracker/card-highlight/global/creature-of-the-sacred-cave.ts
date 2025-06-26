import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const CreatureOfTheSacredCave: GlobalHighlightCard = {
	cardIds: [CardIds.CreatureOfTheSacredCave_TLC_430],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.cardsPlayedThisTurn
				.map((e) => allCards.getCard(e.cardId))
				.filter((c) => c.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.HOLY])
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
