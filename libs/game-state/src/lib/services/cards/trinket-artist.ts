/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TrinketArtist: GeneratingCard = {
	cardIds: [CardIds.TrinketArtist_TOY_882],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				mechanics: [GameTag.DIVINE_SHIELD],
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				mechanics: [GameTag.PALADIN_AURA],
			};
		}
		return null;
	},
};
