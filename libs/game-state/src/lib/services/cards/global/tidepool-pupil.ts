import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getCardId, getCardType } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const TidepoolPupil: GlobalHighlightCard = {
	cardIds: [CardIds.TidepoolPupil_VAC_304],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		// For player, things are handled more accurately
		if (side !== 'opponent') {
			return [];
		}

		const deckState = gameState.opponentDeck;
		const pupil = deckState.findCard(entityId);
		// FIXME: possible bug: a card enter the hand before the pupil, but at the same turn
		// this card will be flagged
		let timestampAtWhichCardEnteredHand = pupil?.card?.metaInfo?.timestampAtWhichCardEnteredHand;
		if (timestampAtWhichCardEnteredHand == null) {
			return [];
		}

		return (
			deckState.cardsPlayedThisMatch
				.filter((c) => (c.timestamp ?? 0) >= (timestampAtWhichCardEnteredHand as number))
				.filter((c) => getCardType(c.cardId, c.entityId, deckState, allCards) === CardType.SPELL)
				// .sort((a, b) => a.turn - b.turn) // Don't re-sort
				.slice(0, 3)
				.map((c) => getCardId(c.cardId, c.entityId, deckState, allCards)) as readonly string[]
		);
	},
};
