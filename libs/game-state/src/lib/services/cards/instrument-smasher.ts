/* eslint-disable no-mixed-spaces-and-tabs */
// Instrument Smasher (ETC_400): 4 Mana 3/6 Demon Hunter
// "[x]Whenever your weapon is destroyed, equip a random Demon Hunter weapon."

import { CardClass, CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON) && hasCorrectClass(c, CardClass.DEMONHUNTER);

export const InstrumentSmasher: StaticGeneratingCard = {
	cardIds: [CardIds.InstrumentSmasher],
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(InstrumentSmasher.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
