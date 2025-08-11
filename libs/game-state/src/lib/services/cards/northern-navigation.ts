/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const NorthernNavigation: GeneratingCard = {
	cardIds: [CardIds.NorthernNavigation],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			spellSchools: [SpellSchool.FROST],
		};
	},
};
