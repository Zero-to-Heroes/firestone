import { SpellSchool } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const CreatureOfTheSacredCave: GlobalHighlightCard = {
	cardIds: [TempCardIds.CreatureOfTheSacredCave],
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
