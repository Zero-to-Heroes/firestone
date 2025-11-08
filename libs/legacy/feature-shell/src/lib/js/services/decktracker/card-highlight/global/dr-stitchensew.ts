import { CardIds, CardType, GameTag, hasCorrectTribe, Race, Zone } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const DrStitchensew: GlobalHighlightCard = {
	cardIds: [CardIds.DrStitchensew_TOY_830],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		// const entity = deckState.AllEntities.find((e) => e.entityId === entityId);
		const createdBy = deckState.AllEntities.filter(
			(e) =>
				e.tags?.find((t) => t.Name === GameTag.CREATOR)?.Value === entityId &&
				e.tags?.find((t) => t.Name === GameTag.CARDTYPE)?.Value === CardType.MINION &&
				(e.tags?.find((t) => t.Name === GameTag.ZONE)?.Value === Zone.SETASIDE ||
					e.tags?.find((t) => t.Name === GameTag.ZONE)?.Value === Zone.PLAY),
		)
			.sort(
				(a, b) =>
					(b.tags?.find((t) => t.Name === GameTag.COST)?.Value ?? 0) -
					(a.tags?.find((t) => t.Name === GameTag.COST)?.Value ?? 0),
			)
			.map((e) => e.cardId);
		return createdBy;
	},
};
