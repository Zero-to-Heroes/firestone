/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Spellslinger (AT_007, WON_344) - Mage Minion (3 mana, 3/4)
 * Battlecry: Both players get a random spell. Yours costs (2) less.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Spellslinger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Spellslinger_AT_007, CardIds.Spellslinger_WON_344],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Spellslinger.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				Spellslinger.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
