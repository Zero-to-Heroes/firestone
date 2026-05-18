import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

// Lesser Diamond Spellstone (LOOT_507, CORE_LOOT_507): Resurrect 2 different friendly minions.
// Diamond Spellstone (LOOT_507t): Resurrect 3 different friendly minions.
// Greater Diamond Spellstone (LOOT_507t2): Resurrect 4 different friendly minions.
export const LesserDiamondSpellstone: GlobalHighlightCard = {
	cardIds: [
		CardIds.LesserDiamondSpellstone,
		CardIds.LesserDiamondSpellstone_DiamondSpellstoneToken,
		CardIds.LesserDiamondSpellstone_GreaterDiamondSpellstoneToken,
		CardIds.LesserDiamondSpellstone_CORE_LOOT_507,
	],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.map((e) => e.id)
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
