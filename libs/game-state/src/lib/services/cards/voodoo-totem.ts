/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const VoodooTotem: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.VoodooTotem as unknown as CardIds],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			VoodooTotem.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.SHADOW),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.SHADOW],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			VoodooTotem.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.SHADOW),
			input.inputOptions,
		);
	},
};
