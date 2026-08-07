/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Sands of Time (TIME_EVENT_999)
// "<b>Rewind</b> <b>Discover</b> a spell from ANY class. <i>(Or just your class after you <b>Rewind</b>!)</i>"
// SHATTERED hand pieces from a discovered Shatter spell must not be restricted to the deck class alone.
export const SandsOfTime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SandsOfTime_TIME_EVENT_999],
	publicCreator: true,
	guessInfo: ({ card, options }: GuessInfoInput): GuessedInfo | null => {
		const isShattered =
			options?.tags?.some((t) => t.Name === GameTag.SHATTERED && t.Value === 1) ||
			card.tags?.[GameTag.SHATTERED] === 1;
		if (!isShattered) {
			return null;
		}
		return {
			canBeAnyCardClass: true,
			cardType: CardType.SPELL,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SandsOfTime.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
};
