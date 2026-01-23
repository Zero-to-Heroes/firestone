// The Nighthold: Cast a random secret from your class
// According to game behavior, it casts from the full pool of all Paladin secrets,
// not constrained by the current game mode (e.g., arena rotation)
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TheNighthold: GlobalHighlightCard = {
	cardIds: [CardIds.RuniTimeExplorer_TheNightholdToken_WON_053t4],
	getRelatedCards: (
		entityId: number,
		side: HighlightSide,
		gameState: GameState,
		allCards: CardsFacadeService,
	): readonly string[] | null => {
		// Return all Paladin secrets, not filtered by game mode
		const allSecrets = allCards
			.getCards()
			.filter(
				(c) =>
					c.type?.toUpperCase() === CardType[CardType.SPELL] &&
					hasMechanic(c, GameTag.SECRET) &&
					c.playerClass === CardClass[CardClass.PALADIN],
			)
			.map((c) => c.id);
		return allSecrets;
	},
};
