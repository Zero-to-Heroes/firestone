/* eslint-disable no-mixed-spaces-and-tabs */
// Battle Vicar (ONY_022)
// 2-Cost Paladin Minion
// Battlecry: Discover a Holy spell.

import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BattleVicar: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BattleVicar],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			BattleVicar.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.HOLY) &&
				canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.HOLY],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			BattleVicar.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.HOLY) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
