/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Blasteroid: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Blasteroid_GDB_303],
	hasSequenceInfo: false,
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Blasteroid.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.FIRE],
		};
	},
};
