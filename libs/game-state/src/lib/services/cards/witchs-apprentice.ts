/* eslint-disable no-mixed-spaces-and-tabs */
// Witch's Apprentice (GIL_531): 1 Mana 0/1 Shaman minion with Taunt
// "<b>Taunt</b> <b>Battlecry:</b> Add a random Shaman spell to your hand."
// The spell is added to hand, so it needs guessInfo for hand tracking

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WitchsApprentice: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WitchsApprentice],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WitchsApprentice.cardIds[0],
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
				WitchsApprentice.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.SHAMAN),
				input.options,
			),
		};
	},
};
