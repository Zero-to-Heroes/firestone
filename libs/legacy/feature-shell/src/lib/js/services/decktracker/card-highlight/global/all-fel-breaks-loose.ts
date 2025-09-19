import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const AllFelBreaksLoose: GlobalHighlightCard = {
	cardIds: [
		CardIds.AllFelBreaksLoose,
		CardIds.AllFelBreaksLoose_CORE_MAW_012,
		CardIds.AllFelBreaksLoose_AllFelBreaksLooseToken,
	],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasCorrectTribe(c, Race.DEMON))
			.map((e) => e.id);
	},
};
