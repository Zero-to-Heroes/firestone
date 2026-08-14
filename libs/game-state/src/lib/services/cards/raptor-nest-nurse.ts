/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Zone } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RaptorNestNurse: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RaptorNestNurse_DINO_434],
	hasSequenceInfo: true,
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RaptorNestNurse.cardIds[0],
			input.allCards,
			(c) => (hasCorrectType(c, CardType.MINION) || hasCorrectType(c, CardType.SPELL)) && hasCost(c, '==', 1),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0 && input.options?.creatorZone !== Zone.GRAVEYARD) {
			return {
				cost: 1,
				cardType: CardType.MINION,
				possibleCards: filterCards(
					RaptorNestNurse.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
					input.options,
				),
			};
		}
		// Because sometimes the Nurse is created in play directly, so the createdIndex never gets incremented
		// by the battlecry
		else if (input.card.createdIndex === 1 || input.options?.creatorZone === Zone.GRAVEYARD) {
			return {
				cost: 1,
				cardType: CardType.SPELL,
				possibleCards: filterCards(
					RaptorNestNurse.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 1),
					input.options,
				),
			};
		}
		return null;
	},
};
