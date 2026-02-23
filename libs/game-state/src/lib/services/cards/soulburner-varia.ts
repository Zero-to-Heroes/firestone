/* eslint-disable no-mixed-spaces-and-tabs */
// Soulburner Varia (YOG_520): 3 Mana 1/5 Legendary Priest Undead minion
// "After a friendly Undead dies, deal 2 damage to the enemy hero and get a random Shadow Priest spell."
// Generates a Shadow Priest spell into hand, so both dynamicPool and guessInfo are needed

import { CardClass, CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SoulburnerVaria: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SoulburnerVaria_YOG_520],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SoulburnerVaria.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.SHADOW) &&
				hasCorrectClass(c, CardClass.PRIEST),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.SHADOW],
			cardClasses: [CardClass.PRIEST],
			possibleCards: filterCards(
				SoulburnerVaria.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					hasSpellSchool(c, SpellSchool.SHADOW) &&
					hasCorrectClass(c, CardClass.PRIEST),
				input.options,
			),
		};
	},
};
