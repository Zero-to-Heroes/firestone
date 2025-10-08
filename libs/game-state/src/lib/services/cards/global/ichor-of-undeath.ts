import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const IchorOfUndeath: GlobalHighlightCard = {
	cardIds: [
		CardIds.Kazakus_IchorOfUndeathToken_CFM_621t37,
		CardIds.Kazakus_IchorOfUndeathToken_CFM_621t38,
		CardIds.Kazakus_IchorOfUndeathToken_CFM_621t39,
	],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => e.cardId)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
