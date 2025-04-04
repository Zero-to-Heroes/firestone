import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const LadyDarkvein: GlobalHighlightCard = {
	cardIds: [CardIds.LadyDarkvein, CardIds.LadyDarkvein_CORE_REV_373],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: string | undefined = deckState.spellsPlayedThisMatch
			.filter((card) => {
				const ref = allCards.getCard(card.cardId);
				return ref.spellSchool === SpellSchool[SpellSchool.SHADOW];
			})
			.pop()?.cardId;
		if (!candidate) {
			return null;
		}
		return [candidate];
	},
};
