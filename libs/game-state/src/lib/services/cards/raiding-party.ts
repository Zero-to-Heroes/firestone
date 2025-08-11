/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const RaidingParty: GeneratingCard = {
	cardIds: [CardIds.RaidingParty, CardIds.RaidingParty_CORE_TRL_124],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0 || input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.PIRATE],
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.WEAPON,
			};
		}
		return null;
	},
};
