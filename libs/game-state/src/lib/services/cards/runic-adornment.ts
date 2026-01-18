/* eslint-disable no-mixed-spaces-and-tabs */
// Runic Adornment (TTN_845)
// Demon Hunter Epic Spell - Cost: 2
// "Discover a spell that costs (3) or less. Shuffle 2 copies into your deck that Cast When Drawn."
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RunicAdornment: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RunicAdornment],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			RunicAdornment.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.SPELL,
			cost: { cost: 3, comparison: '<=' },
			possibleCards: filterCards(
				RunicAdornment.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
