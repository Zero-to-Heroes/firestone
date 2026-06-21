/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Scarlet Recruiter (JAIL_516)
 * Battlecry: Summon two minions from your deck that cost (2) or less. Give them Rush.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { and, effectiveCostLess, inDeck, minion, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, SelectorCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const maxCost = 2;

export const ScarletRecruiter: GeneratingCard & StaticGeneratingCard & SelectorCard = {
	cardIds: [TempCardIds.ScarletRecruiter_JAIL_516 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const ids = input.inputOptions.deckState.deck
			.map((c) => c.cardId)
			.filter((cardId): cardId is string => {
				if (!cardId) return false;
				const ref = input.allCards.getCard(cardId);
				return hasCorrectType(ref, CardType.MINION) && (ref?.cost ?? 99) <= maxCost;
			});
		return ids;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const ids = input.deckState.deck
			.map((c) => c.cardId)
			.filter((cardId): cardId is string => {
				if (!cardId) return false;
				const ref = input.allCards.getCard(cardId);
				return hasCorrectType(ref, CardType.MINION) && (ref?.cost ?? 99) <= maxCost;
			});
		return { cardType: CardType.MINION, possibleCards: ids.length ? ids : null };
	},
	selector: (inputSide) => and(side(inputSide), inDeck, minion, effectiveCostLess(3)),
};
