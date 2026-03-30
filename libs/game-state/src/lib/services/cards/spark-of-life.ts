/**
 * Spark of Life (EDR_872)
 * Choose One — Discover a Mage spell; or Discover a Druid spell.
 *
 * Shattered hand pieces are hidden (SHATTERED); each half can still belong to either class depending
 * on the discover outcome, so guesses must union Mage ∪ Druid instead of the opponent deck class alone.
 */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const SparkOfLife: GeneratingCard = {
	cardIds: [CardIds.SparkOfLife_EDR_872],
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
