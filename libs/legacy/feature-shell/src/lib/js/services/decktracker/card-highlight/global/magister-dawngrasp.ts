import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const MagisterDawngrasp: GlobalHighlightCard = {
	cardIds: [CardIds.MagisterDawngrasp_AV_200],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const dynamic = deckState.spellsPlayedThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => !!c?.spellSchool)
			.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))
			.map((e) => e.id);
		return [
			...dynamic,
			...(allCards
				.getCard(CardIds.MagisterDawngrasp_AV_200)
				.relatedCardDbfIds?.map((c) => allCards.getCard(c).id) ?? []),
		].filter((c) => !!c);
	},
};
