/* eslint-disable no-mixed-spaces-and-tabs */
// Skyfin (DRG_072): 5 Mana 3/3 Neutral Murloc/Dragon minion
// "<b>Battlecry:</b> If you're holding a Dragon, summon 2 random Murlocs."
// The minions are summoned, so only dynamicPool is needed (no guessInfo)

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Skyfin: StaticGeneratingCard = {
	cardIds: [CardIds.Skyfin],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Skyfin.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
};
