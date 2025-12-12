/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardIds,
	CardType,
	CREWMATES,
	GameFormat,
	GameType,
	hasCorrectTribe,
	Race,
} from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { Metadata } from '../../models/metadata';
import { filterCards, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const EmergencyMeeting: GeneratingCard = {
	cardIds: [CardIds.EmergencyMeeting_GDB_119],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		let possibleCards: readonly string[] = [];
		if (input.card.createdIndex === 0 || input.card.createdIndex == 1) {
			return {
				possibleCards: CREWMATES,
			};
		} else if (input.card.createdIndex === 2) {
			const options = input.options as { metadata?: Metadata; validArenaPool?: readonly string[] } | undefined;
			possibleCards = filterCards(
				input.allCards,
				{
					currentClass: input.deckState.getCurrentClass(),
					format: options?.metadata?.formatType ?? GameFormat.FT_STANDARD,
					gameType: options?.metadata?.gameType ?? GameType.GT_RANKED,
					scenarioId: options?.metadata?.scenarioId ?? 0,
					validArenaPool: options?.validArenaPool ?? [],
				},
				EmergencyMeeting.cardIds[0],
				(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '<=', 3) && hasCorrectTribe(c, Race.DEMON),
			);
		}
		return {
			possibleCards: possibleCards,
		};
	},
};
