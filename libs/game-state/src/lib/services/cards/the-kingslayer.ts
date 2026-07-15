/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TheKingslayers: GeneratingCard = {
	cardIds: [CardIds.GaronaHalforcen_TheKingslayersToken_TIME_875t1],
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			rarity: CardRarity.LEGENDARY,
		};
	},
};
