import { CardIds, GameTag } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const UrsolsAura: GlobalHighlightCard = {
	cardIds: [CardIds.Ursol_UrsolsAura_EDR_259e1],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const entity = gameState.parserState?.CurrentEntities.get(entityId);
		if (!entity) {
			return [];
		}

		const replayedCardEntityId = getEntityTag(entity, GameTag.TAG_SCRIPT_DATA_ENT_1);
		if (replayedCardEntityId <= 0) {
			return [];
		}
		const replayedCard = deckState.findCard(replayedCardEntityId)?.card;
		return replayedCard ? [replayedCard.cardId] : [];
	},
};
