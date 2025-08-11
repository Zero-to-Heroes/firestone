/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const FarseerWo: GeneratingCard = {
	cardIds: [CardIds.FarseerWo_TIME_013],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.NATURE],
		};
	},
};
