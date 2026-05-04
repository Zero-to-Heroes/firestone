import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';

/** Jim Raynor highlights + starships-launched counter; separate from counter module to avoid card barrel circular imports. */
export const getStarshipsLaunchedCardIds = (
	side: 'player' | 'opponent',
	gameState: GameState,
	allCards: CardsFacadeService,
): readonly string[] => {
	const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
	const otherDeckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
	const starshipsOwn = deckState
		.getAllCardsInDeckWithoutOptions()
		.filter((c) => !c.stolenFromOpponent)
		.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
		.filter((c) => c.tags[GameTag.LAUNCHPAD] !== 1);
	const starshipsStolen = otherDeckState
		.getAllCardsInDeckWithoutOptions()
		.filter((c) => c.stolenFromOpponent)
		.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
		.filter((c) => c.tags[GameTag.LAUNCHPAD] !== 1);
	const cardIds = [...starshipsOwn, ...starshipsStolen].flatMap((c) => [
		c.cardId,
		...(c.storedInformation?.cards
			?.filter((c) => allCards.getCard(c?.cardId).mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]))
			?.map((c) => c.cardId) ?? []),
	]);
	return cardIds;
};
