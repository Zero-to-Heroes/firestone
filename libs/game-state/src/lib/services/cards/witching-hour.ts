/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, Race, hasCorrectTribe } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { and, beast, inGraveyard, side } from '../card-highlight/selectors';
import { SelectorCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

/**
 * Summon a random friendly Beast that died this game.
 */
export const WhitchingHour: StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.WitchingHour],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = input.inputOptions.deckState.minionsDeadThisMatch
			.map((e) => e.cardId)
			.filter((cardId) => {
				const card = input.allCards.getCard(cardId);
				return card && hasCorrectTribe(card, Race.BEAST);
			})
			// Remove duplicates
			.filter((value, index, self) => self.indexOf(value) === index);
		return possibleCards;
	},
	selector: (inputSide: HighlightSide) => and(side(inputSide), inGraveyard, beast),
};
