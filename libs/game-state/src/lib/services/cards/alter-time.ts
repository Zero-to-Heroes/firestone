/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const AlterTime: GeneratingCard = {
	cardIds: [CardIds.AlterTime_TIME_857],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.ARCANE],
		};
	},
};
