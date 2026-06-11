/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Prince Malchezaar (KAR_096)
 * Start of Game: Add 5 extra Legendary minions to your deck.
 *
 * Cards are created in deck with creatorCardId KAR_096 (random, not discover).
 */
import { CardIds, CardRarity, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const legendaryMinionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const PrinceMalchezaar: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PrinceMalchezaar_KAR_096],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(PrinceMalchezaar.cardIds[0], input.allCards, legendaryMinionFilter, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PrinceMalchezaar.cardIds[0],
			input.allCards,
			legendaryMinionFilter,
			input.options,
		);
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			possibleCards,
		};
	},
};
