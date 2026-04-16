/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Fyrakk the Blazing (FIR_959)
 *
 * Battlecry: Cast 15 Mana worth of Fire spells at random enemies.
 * Generated spells are Fire spells only; secrets cast from this effect should narrow to Fire secrets
 * via guessedInfo.possibleCards + SecretConfigService.
 */
import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectSpellSchool, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isFyrakkFireSpell = (c: ReferenceCard): boolean =>
	hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FIRE);

export const FyrakkTheBlazing: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FyrakkTheBlazing_FIR_959],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			FyrakkTheBlazing.cardIds[0],
			input.allCards,
			isFyrakkFireSpell,
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.FIRE],
			possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(FyrakkTheBlazing.cardIds[0], input.allCards, isFyrakkFireSpell, input.inputOptions);
	},
};
