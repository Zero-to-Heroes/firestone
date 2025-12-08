import { arenaSets, CardIds, GameFormat, isArena, SetId, standardSets, wildSets } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '../../../../shared/framework/core/src/lib/services/cards-facade.service';
import { Metadata } from '../models/metadata';

export const getValidSetsInCurrentGame = (metadata: Metadata): readonly SetId[] => {
	const gameMode = metadata.gameType;
	if (isArena(gameMode)) {
		return arenaSets;
	}
	const gameFormat = metadata.formatType;
	if (gameFormat === GameFormat.FT_STANDARD) {
		return standardSets;
	}
	return wildSets;
};
export const areCardsValidInCurrentGame = (
	cards: readonly CardIds[],
	metadata: Metadata,
	allCards: CardsFacadeService,
): boolean => {
	const validSets = getValidSetsInCurrentGame(metadata);
	return cards.some((cardId) => validSets.includes(allCards.getCard(cardId)?.set?.toLowerCase() as SetId));
};
