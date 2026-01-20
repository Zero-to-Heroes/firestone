// A Light in the Darkness (OG_311 / WON_333): 2 Mana Paladin spell
// "<b>Discover</b> a Paladin minion. Give it +2/+2."
// The card is discovered, so it needs guessInfo for the Paladin minion pool.

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isPaladinMinion = (card: Parameters<typeof hasCorrectType>[0]) =>
	hasCorrectType(card, CardType.MINION) && hasCorrectClass(card, CardClass.PALADIN);

export const ALightInTheDarkness: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ALightInTheDarkness, CardIds.ALightInTheDarkness_WON_333],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ALightInTheDarkness.cardIds[0],
			input.allCards,
			(card) => isPaladinMinion(card),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ALightInTheDarkness.cardIds[0],
			input.allCards,
			(card) => isPaladinMinion(card),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			cardClasses: [CardClass.PALADIN],
			possibleCards: possibleCards,
		};
	},
};
