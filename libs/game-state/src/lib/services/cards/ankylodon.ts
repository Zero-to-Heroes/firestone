/* eslint-disable no-mixed-spaces-and-tabs */
// Ankylodon (DINO_422): 6 Mana 7/5 BEAST
// "[x]<b><b>Taunt</b>. Deathrattle:</b> Summon two random 3-Cost Beasts. They attack random enemies."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3);

export const Ankylodon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Ankylodon_DINO_422],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Ankylodon.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Ankylodon.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], cost: 3, possibleCards };
	},
};
