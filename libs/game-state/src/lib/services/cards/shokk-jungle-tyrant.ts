/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const ShokkJungleTyrant: GeneratingCard = {
	cardIds: [CardIds.TheFoodChain_ShokkJungleTyrantToken_TLC_830t],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				attack: 8,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 8,
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				attack: 6,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 6,
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				attack: 4,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 4,
					input.options,
				),
			};
		}
		return null;
	},
};
