import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const WallowTheWretched: GlobalHighlightCard = {
	cardIds: [CardIds.WallowTheWretched_EDR_487],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.fullGameState!.Player : gameState.fullGameState!.Opponent;
		const darkGiftsDEBUG = deckState.AllEntities.filter(
			(e) => e.tags?.find((t) => t.Name === GameTag.IS_NIGHTMARE_BONUS)?.Value === 1,
		).filter((e) => {
			const zone = e.tags.find((t) => t.Name === GameTag.ZONE)?.Value;
			return zone !== Zone.SETASIDE && zone !== Zone.REMOVEDFROMGAME;
		});
		console.debug('darkGiftsDEBUG', darkGiftsDEBUG);
		const darkGifts = deckState.AllEntities.filter(
			(e) => e.tags?.find((t) => t.Name === GameTag.IS_NIGHTMARE_BONUS)?.Value === 1,
		)
			.filter((e) => {
				const zone = e.tags.find((t) => t.Name === GameTag.ZONE)?.Value;
				return zone !== Zone.SETASIDE && zone !== Zone.REMOVEDFROMGAME;
			})
			// So that gifts created before the Wallow card (if it's generated for instance) are not included
			.filter((e) => !entityId || e.entityId > entityId)
			.filter((e) => e.tags.find((t) => t.Name === GameTag.CARDTYPE)?.Value === CardType.SPELL)
			.map((e) => e.cardId)
			// Unique - each dark gift is only applied once
			.filter((e, index, self) => self.indexOf(e) === index);
		return darkGifts;
	},
};
