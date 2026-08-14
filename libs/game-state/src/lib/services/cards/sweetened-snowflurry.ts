/* eslint-disable no-mixed-spaces-and-tabs */
// Sweetened Snowflurry (TOY_307 / TOY_307t): 3 Mana 3/3 Elemental
// "Miniaturize. Battlecry: Get 2 random Temporary Frost spells."
import { CardIds, CardType, GameTag, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectSpellSchool, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FROST);

export const SweetenedSnowflurry: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SweetenedSnowflurry_TOY_307, CardIds.SweetenedSnowflurry_SweetenedSnowflurryToken_TOY_307t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SweetenedSnowflurry.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			spellSchools: [SpellSchool.FROST],
		};
	},
};
