/* eslint-disable no-mixed-spaces-and-tabs */
// Murloc Knight (AT_076): 4 Mana 3/4 Paladin Murloc minion
// "<b>Inspire:</b> Summon a random Murloc."
// The minion is summoned, so only dynamicPool is needed (no guessInfo)

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MurlocKnight: StaticGeneratingCard = {
	cardIds: [CardIds.MurlocKnight],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MurlocKnight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
};
