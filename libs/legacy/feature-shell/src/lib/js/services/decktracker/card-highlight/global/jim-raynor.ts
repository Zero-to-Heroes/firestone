import { CardIds } from '@firestone-hs/reference-data';
import { GameState, getStarshipsLaunchedCardIds } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const JimRaynor: GlobalHighlightCard = {
	cardIds: [CardIds.JimRaynor_SC_400, CardIds.Thor_ThorExplosivePayloadToken_SC_414t],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		if (side === 'single' || side === 'arena-draft') {
			return [];
		}
		const cardIds = getStarshipsLaunchedCardIds(side, gameState, allCards);
		console.debug('[jim-raynor] related cards', cardIds);
		return cardIds;
	},
};
