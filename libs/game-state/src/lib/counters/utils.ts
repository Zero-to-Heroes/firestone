import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Metadata } from '../models/metadata';
import { isCardValidForGame } from '../services/card-utils';

// export const getValidSetsInCurrentGame = (metadata: Metadata): readonly SetId[] => {
// 	const gameMode = metadata.gameType;
// 	if (isArena(gameMode)) {
// 		return arenaSets;
// 	}
// 	const gameFormat = metadata.formatType;
// 	if (gameFormat === GameFormat.FT_STANDARD) {
// 		return standardSets;
// 	}
// 	return wildSets;
// };
export const areCardsValidInCurrentGame = (
	cards: readonly CardIds[],
	metadata: Metadata,
	allCards: CardsFacadeService,
	curatedPools: {
		arena: readonly string[];
	},
	debug = false,
): boolean => {
	debug && console.debug('[debug] areCardsValidInCurrentGame', cards, metadata);
	return cards.some((cardId) =>
		isCardValidForGame(allCards.getCard(cardId), metadata.formatType, metadata.gameType, curatedPools),
	);
	// const validSets = getValidSetsInCurrentGame(metadata);
	// return (
	// 	validSets.length === 0 ||
	// 	cards.some((cardId) => validSets.includes(allCards.getCard(cardId)?.set?.toLowerCase() as SetId))
	// );
};
