/* eslint-disable no-mixed-spaces-and-tabs */
// Murgurgle Prime (BT_019t): 8 Mana 6/3 Paladin Murloc minion
// "<b>Divine Shield</b>\n<b>Battlecry:</b> Summon 4 random Murlocs. Give them <b>Divine Shield</b>."
// The minions are summoned, so only dynamicPool is needed (no guessInfo)

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MurgurglePrime: StaticGeneratingCard = {
	cardIds: [CardIds.MurgurMurgurgle_MurgurglePrimeToken],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MurgurglePrime.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
};
