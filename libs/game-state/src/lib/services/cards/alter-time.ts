/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameFormat, GameType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { isCardValidForGame } from '../card-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards, filterCardsFromThePast } from './utils';

export const AlterTime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AlterTime_TIME_857],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(
			AlterTime.cardIds[0],
			input.allCards,
			(c) =>
				!isCardValidForGame(c, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.ARCANE) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.ARCANE],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AlterTime.cardIds[0],
			input.allCards,
			(c) =>
				!isCardValidForGame(c, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.ARCANE) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
