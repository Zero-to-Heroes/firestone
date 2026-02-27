/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const NorthernNavigation: GeneratingCard = {
	cardIds: [CardIds.NorthernNavigation],
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentBoard = input.opponentDeckState.board;
		const isOpponentMinionFrozen = opponentBoard.some((card) => card.tags?.[GameTag.FROZEN] === 1);
		if (isOpponentMinionFrozen) {
			const possibleCards = filterCards(
				NorthernNavigation.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasSpellSchool(c, SpellSchool.FROST) &&
					// This is not technically correct, but it's the most likely
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			);
			return {
				cardType: CardType.SPELL,
				spellSchools: [SpellSchool.FROST],
				possibleCards: possibleCards,
			};
		}
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				NorthernNavigation.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
