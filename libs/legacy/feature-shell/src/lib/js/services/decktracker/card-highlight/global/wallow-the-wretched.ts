import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const WallowTheWretched: GlobalHighlightCard = {
	cardIds: [CardIds.WallowTheWretched_EDR_487],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		const darkGifts = deckState.AllEntities.filter(
			(e) => e.tags?.find((t) => t.Name === GameTag.IS_NIGHTMARE_BONUS)?.Value === 1,
		)
			.filter((e) => {
				const zone = e.tags.find((t) => t.Name === GameTag.ZONE)?.Value;
				return zone !== Zone.SETASIDE && zone !== Zone.REMOVEDFROMGAME;
			})
			.filter((e) => e.tags.find((t) => t.Name === GameTag.CARDTYPE)?.Value === CardType.SPELL)
			.map((e) => e.cardId);
		return darkGifts;
	},
};
