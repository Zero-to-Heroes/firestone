/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Frantic Forger (JAIL_986)
 * Battlecry: Get a random playable spell. It is Temporary.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const playableSpellFilter = (maxCost: number) => (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', maxCost);

export const FranticForger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.FranticForger_JAIL_986 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const manaLeft = input.inputOptions.deckState.manaLeft;
		const forgerCost =
			input.inputOptions.deckState.findCard(input.entityId)?.card?.getEffectiveManaCost() ??
			input.allCards.getCard(TempCardIds.FranticForger_JAIL_986 as unknown as CardIds)?.cost ??
			0;
		const availableMana = Math.max(0, manaLeft - forgerCost);
		return filterCards(
			TempCardIds.FranticForger_JAIL_986 as unknown as CardIds,
			input.allCards,
			playableSpellFilter(availableMana),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Assumption is that forger cost has already been deducted from the mana left
		const manaLeft = input.deckState.manaLeft;
		return {
			cardType: CardType.SPELL,
			cost: { cost: manaLeft, comparison: '<=' },
			possibleCards: filterCards(
				TempCardIds.FranticForger_JAIL_986 as unknown as CardIds,
				input.allCards,
				playableSpellFilter(manaLeft),
				input.options,
			),
		};
	},
};
