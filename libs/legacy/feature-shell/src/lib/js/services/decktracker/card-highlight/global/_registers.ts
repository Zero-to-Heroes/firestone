import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { JimRaynor } from './jim-raynor';

export const globalRelatedCards: { [cardId: string]: GlobalHighlightCard } = {
	[CardIds.JimRaynor_SC_400]: JimRaynor,
	[CardIds.Thor_ThorExplosivePayloadToken_SC_414t]: JimRaynor,
};

export interface GlobalHighlightCard {
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => readonly string[];
}
