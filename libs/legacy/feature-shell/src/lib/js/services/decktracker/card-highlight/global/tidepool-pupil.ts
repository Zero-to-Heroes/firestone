import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TidepoolPupil: GlobalHighlightCard = {
	cardIds: [CardIds.TidepoolPupil_VAC_304],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		// For player, things are handled more accurately
		if (side !== 'opponent') {
			return null;
		}

		const deckState = gameState.opponentDeck;
		const pupil = deckState.findCard(entityId);
		let turnAtWhichEnteredHand = pupil?.card?.metaInfo?.turnAtWhichCardEnteredHand;
		console.debug('[debug] tidepool pupil', pupil, turnAtWhichEnteredHand);
		if (turnAtWhichEnteredHand === 'mulligan') {
			turnAtWhichEnteredHand = 0;
		}
		console.debug('[debug] tidepool pupil corrected', pupil, turnAtWhichEnteredHand);
		if (turnAtWhichEnteredHand == null) {
			return [];
		}

		return deckState.cardsPlayedThisMatch
			.filter((c) => c.turn >= (turnAtWhichEnteredHand as number))
			.filter((c) => allCards.getCard(c.cardId)?.type?.toUpperCase() === CardType[CardType.SPELL])
			.sort((a, b) => a.turn - b.turn)
			.slice(0, 3)
			.map((c) => c.cardId);
	},
};
