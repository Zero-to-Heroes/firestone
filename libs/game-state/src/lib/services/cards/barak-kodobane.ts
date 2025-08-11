/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const BarakKodobane: GeneratingCard = {
	cardIds: [CardIds.BarakKodobane_BAR_551, CardIds.BarakKodobane_CORE_BAR_551],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.SPELL,
			};
		}
		return null;
	},
};
