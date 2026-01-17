/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vuja De (TOT_108)
 * Text: "Discover a copy of a spell you played this game. Combo: And a minion."
 * 
 * Base effect: Discover a spell from spells you've played this game (1 card)
 * Combo effect: Also discover a minion from minions you've played this game (2 cards total)
 * 
 * Since this is a Discover card, it uses guessInfo for the pool.
 * The dynamicPool is used for showing what cards can potentially be generated on the board/in hand.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const VujaDe: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DéjàVu],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get spells played this match
		const spellsPlayed = input.inputOptions.deckState.spellsPlayedThisMatch
			?.map((c) => c.cardId)
			.filter((c) => !!c) ?? [];
		const uniqueSpells = [...new Set(spellsPlayed)];

		// Get minions played this match
		const minionsPlayed = input.inputOptions.deckState.cardsPlayedThisMatch
			?.map((c) => c.cardId)
			.filter((c) => !!c)
			.filter((cardId) => {
				const card = input.allCards.getCard(cardId);
				return card?.type?.toUpperCase() === CardType[CardType.MINION];
			}) ?? [];
		const uniqueMinions = [...new Set(minionsPlayed)];

		// Check if Combo is active (cards have been played this turn)
		const comboActive = (input.inputOptions.deckState.cardsPlayedThisTurn?.length ?? 0) > 0;

		// Return pool based on whether Combo is active
		if (comboActive) {
			return [...uniqueSpells, ...uniqueMinions];
		}
		return uniqueSpells;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Get spells played this match
		const spellsPlayed = input.deckState.spellsPlayedThisMatch
			?.map((c) => c.cardId)
			.filter((c) => !!c) ?? [];
		const uniqueSpells = [...new Set(spellsPlayed)];

		// Get minions played this match
		const minionsPlayed = input.deckState.cardsPlayedThisMatch
			?.map((c) => c.cardId)
			.filter((c) => !!c)
			.filter((cardId) => {
				const card = input.allCards.getCard(cardId);
				return card?.type?.toUpperCase() === CardType[CardType.MINION];
			}) ?? [];
		const uniqueMinions = [...new Set(minionsPlayed)];

		// createdIndex 0 = the spell discovered (always available)
		// createdIndex 1 = the minion discovered (only if Combo was active)
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				possibleCards: uniqueSpells,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				possibleCards: uniqueMinions,
			};
		}
		return null;
	},
};
