import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const JimRaynor: GlobalHighlightCard = {
	cardIds: [CardIds.JimRaynor_SC_400, CardIds.Thor_ThorExplosivePayloadToken_SC_414t],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const starships = deckState
			.getAllCardsInDeckWithoutOptions()
			.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
			.filter((c) => !c.tags?.some((t) => t.Name === GameTag.LAUNCHPAD && t.Value === 1));
		const cardIds = starships.flatMap((c) => [
			c.cardId,
			...(c.storedInformation?.cards
				.filter((c) => allCards.getCard(c?.cardId).mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]))
				?.map((c) => c.cardId) ?? []),
		]);
		console.debug('[jim-raynor] related cards', cardIds);
		return cardIds;
	},
};
