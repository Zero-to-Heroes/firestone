/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const AeonWizard: GeneratingCard = {
	cardIds: [CardIds.AeonWizard_TIME_002],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
		};
	},
};
