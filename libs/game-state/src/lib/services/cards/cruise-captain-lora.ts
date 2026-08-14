/* eslint-disable no-mixed-spaces-and-tabs */
// Cruise Captain Lora (VAC_506): 6 Mana 4/5 PIRATE
// "Battlecry: Summon 2 random locations."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.LOCATION];

export const CruiseCaptainLora: StaticGeneratingCard = {
	cardIds: [CardIds.CruiseCaptainLora_VAC_506],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CruiseCaptainLora.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
