import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const LadyDarkvein: GlobalHighlightCard = {
	cardIds: [CardIds.LadyDarkvein, CardIds.LadyDarkvein_CORE_REV_373],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: string | undefined = deckState.spellsPlayedThisMatch
			.filter((card) => {
				const ref = getProcessedCard(card.cardId, card.entityId, deckState, allCards);
				return ref.spellSchool === SpellSchool[SpellSchool.SHADOW];
			})
			.pop()?.cardId;
		if (!candidate) {
			return null;
		}
		return [candidate];
	},
};
