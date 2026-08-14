/**
 * Spark of Life (EDR_872)
 * Choose One — Discover a Mage spell; or Discover a Druid spell.
 *
 * Shattered hand pieces are hidden (SHATTERED); each half can still belong to either class depending
 * on the discover outcome, so guesses must union Mage ∪ Druid instead of the opponent deck class alone.
 */
import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SparkOfLife: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SparkOfLife_EDR_872],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SparkOfLife.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				(c.classes?.includes(CardClass[CardClass.MAGE]) || c.classes?.includes(CardClass[CardClass.DRUID])),
			input.inputOptions,
		),
	guessInfo: ({ card, options }: GuessInfoInput): GuessedInfo | null => {
		const isShattered =
			options?.tags?.some((t) => t.Name === GameTag.SHATTERED && t.Value === 1) ||
			card.tags?.[GameTag.SHATTERED] === 1;
		if (!isShattered) {
			return null;
		}
		return {
			cardClasses: [CardClass.MAGE, CardClass.DRUID],
		};
	},
};
