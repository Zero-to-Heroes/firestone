/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SootSpewer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SootSpewer, CardIds.SootSpewer_WON_033],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SootSpewer.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FIRE),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.FIRE],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SootSpewer.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FIRE),
			input.inputOptions,
		);
	},
};
