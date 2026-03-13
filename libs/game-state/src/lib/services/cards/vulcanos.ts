// Vulcanos (CATA_488): 7-Cost 4/8 Mage Elemental Minion
// "Colossal +2. At the end of your turn, deal 2 damage to all other minions."
// Plume of Vulcanos (CATA_488t / CATA_488t2): 2-Cost 1/4 Elemental Minion (tokens)
// "Whenever this takes damage, get a random Fire spell. It costs (3) less."

import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Vulcanos: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.Vulcanos_PlumeOfVulcanosToken_CATA_488t,
		CardIds.Vulcanos_PlumeOfVulcanosToken_CATA_488t2,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.cardId,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FIRE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Vulcanos.cardIds[0],
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
};
