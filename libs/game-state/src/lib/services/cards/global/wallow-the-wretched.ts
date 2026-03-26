import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEntitiesForPlayer, getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const WallowTheWretched: GlobalHighlightCard = {
	cardIds: [CardIds.WallowTheWretched_EDR_487],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		const playerId = side === 'player' ? gameState.localPlayerId : gameState.opponentPlayerId;
		if (!currentEntities || !playerId) return [];
		const darkGifts = getEntitiesForPlayer(currentEntities, playerId)
			.filter((e) => getEntityTag(e, GameTag.IS_NIGHTMARE_BONUS) === 1)
			.filter((e) => {
				const zone = getEntityTag(e, GameTag.ZONE);
				return zone !== (Zone.SETASIDE as number) && zone !== (Zone.REMOVEDFROMGAME as number);
			})
			.filter((e) => !entityId || e.Id > entityId)
			.filter((e) => getEntityTag(e, GameTag.CARDTYPE) === (CardType.SPELL as number))
			.map((e) => e.CardId)
			.filter((e, index, self) => self.indexOf(e) === index);
		return darkGifts;
	},
};
