/* eslint-disable no-mixed-spaces-and-tabs */
// Witch's Cauldron (GIL_819): 3 Mana 0/4 Neutral minion
// "After a friendly minion dies, add a random Shaman spell to your hand."
// The spell is added to hand, so it needs guessInfo for hand tracking

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WitchsCauldron: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WitchsCauldron],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WitchsCauldron.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.SHAMAN),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.SHAMAN],
			possibleCards: filterCards(
				WitchsCauldron.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.SHAMAN),
				input.options,
			),
		};
	},
};
