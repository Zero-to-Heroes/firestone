/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * A Dashof That (JAIL_201b)
 * Get a random Druid card.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const tauntMinionFilter = (c: Parameters<typeof hasCorrectClass>[0]) =>
	hasMechanic(c, GameTag.TAUNT) && hasCorrectType(c, CardType.MINION);

export const BackupTuningFork: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RemixedTuningFork_BackupTuningForkToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.RemixedTuningFork_BackupTuningForkToken,
			input.allCards,
			tauntMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		mechanics: [GameTag.TAUNT],
		possibleCards: filterCards(
			CardIds.RemixedTuningFork_BackupTuningForkToken,
			input.allCards,
			tauntMinionFilter,
			input.options,
		),
	}),
};
