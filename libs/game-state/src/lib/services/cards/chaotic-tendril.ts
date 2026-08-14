/* eslint-disable no-mixed-spaces-and-tabs */
// Chaotic Tendril (YOG_514): 1 Mana 1/1
// "<b>Battlecry:</b> Cast a random 1-Cost spell. Improve your future Chaotic Tendrils."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const tendrilCost = (playedThisMatch: number) => playedThisMatch + 1;

export const ChaoticTendril: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ChaoticTendril_YOG_514],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = tendrilCost(input.inputOptions.deckState.chaoticTendrilsPlayedThisMatch);
		return filterCards(
			ChaoticTendril.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', cost),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cost = tendrilCost(input.deckState.chaoticTendrilsPlayedThisMatch);
		return {
			cardType: CardType.SPELL,
			cost,
			possibleCards: filterCards(
				ChaoticTendril.cardIds[0],
				input.allCards,
				(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', cost),
				input.options,
			),
		};
	},
};
