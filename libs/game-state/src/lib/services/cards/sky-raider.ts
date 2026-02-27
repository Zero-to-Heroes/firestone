/* eslint-disable no-mixed-spaces-and-tabs */
// Sky Raider (DRG_024): 1 Mana 1/2 Warrior Pirate minion
// "<b>Battlecry:</b> Add a random Pirate to your hand."
// The minion is added to hand (random, not discover), so it needs dynamicPool + guessInfo

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SkyRaider: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SkyRaider],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SkyRaider.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.PIRATE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SkyRaider.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.PIRATE),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.PIRATE],
			possibleCards: possibleCards,
		};
	},
};
