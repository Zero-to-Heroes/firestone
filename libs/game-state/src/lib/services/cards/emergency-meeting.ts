/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, CREWMATES, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EmergencyMeeting: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EmergencyMeeting_GDB_119],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => [
		...CREWMATES,
		...filterCards(
			EmergencyMeeting.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '<=', 3) && hasCorrectTribe(c, Race.DEMON),
			input.inputOptions,
		),
	],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0 || input.card.createdIndex == 1) {
			return {
				possibleCards: CREWMATES,
			};
		}
		if (input.card.createdIndex === 2) {
			return {
				possibleCards: filterCards(
					EmergencyMeeting.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '<=', 3) && hasCorrectTribe(c, Race.DEMON),
					input.options,
				),
			};
		}
		return {
			possibleCards: [],
		};
	},
};
