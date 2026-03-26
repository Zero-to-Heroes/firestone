import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const DrStitchensew: GlobalHighlightCard = {
	cardIds: [CardIds.DrStitchensew_TOY_830],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];
		const createdBy = [...currentEntities.values()]
			.filter(
				(e) =>
					getEntityTag(e, GameTag.CREATOR) === entityId &&
					getEntityTag(e, GameTag.CARDTYPE) === (CardType.MINION as number) &&
					(getEntityTag(e, GameTag.ZONE) === (Zone.SETASIDE as number) ||
						getEntityTag(e, GameTag.ZONE) === (Zone.PLAY as number)),
			)
			.sort((a, b) => getEntityTag(b, GameTag.COST, 0) - getEntityTag(a, GameTag.COST, 0))
			.map((e) => e.CardId);
		return createdBy;
	},
};
