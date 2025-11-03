import { GameFormat, GameTag, GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Metadata } from '../../models/metadata';
import { filterCards as filterCardsOriginal } from '../../related-cards/dynamic-pools';

export const filterCards = (
	sourceCardId: string,
	allCards: CardsFacadeService,
	filter: (c: ReferenceCard) => boolean,
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
		metadata?: Metadata;
		validArenaPool?: readonly string[];
	},
): readonly string[] => {
	return filterCardsOriginal(
		allCards.getService(),
		{
			format: options?.metadata?.formatType ?? GameFormat.FT_STANDARD,
			gameType: options?.metadata?.gameType ?? GameType.GT_RANKED,
			scenarioId: options?.metadata?.scenarioId ?? 0,
			validArenaPool: options?.validArenaPool ?? [],
		},
		sourceCardId,
		(c) => filter(c),
	);
};
