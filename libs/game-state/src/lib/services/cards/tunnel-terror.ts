/* eslint-disable no-mixed-spaces-and-tabs */
// Tunnel Terror (TLC_469): 3 Mana 4/3 BEAST
// "<b>Deathrattle:</b> Get two random <b>Temporary</b> 2-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const TunnelTerror: StaticGeneratingCard = {
	cardIds: [CardIds.TunnelTerror_TLC_469],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TunnelTerror.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
