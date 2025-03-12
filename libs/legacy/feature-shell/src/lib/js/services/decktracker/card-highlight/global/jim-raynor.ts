import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getSpaceshipsLaunchedCardIds } from 'libs/game-state/src/lib/counters/impl/spaceships-launched';
import { GlobalHighlightCard } from './_registers';

export const JimRaynor: GlobalHighlightCard = {
	cardIds: [CardIds.JimRaynor_SC_400, CardIds.Thor_ThorExplosivePayloadToken_SC_414t],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		if (side === 'single') {
			return [];
		}
		const cardIds = getSpaceshipsLaunchedCardIds(side, gameState, allCards);
		console.debug('[jim-raynor] related cards', cardIds);
		return cardIds;
	},
};
