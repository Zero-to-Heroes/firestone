/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const MendTheTimeline: GeneratingCard = {
	cardIds: [CardIds.MendTheTimeline_TIME_018],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			MendTheTimeline.cardIds[0],
			input.allCards,
			(c) => !!c.spellSchool && SpellSchool[c.spellSchool] === SpellSchool.HOLY,
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.HOLY],
			possibleCards: possibleCards,
		};
	},
};
