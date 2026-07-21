/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Staffof Trickery (JAIL_875)
 * After your hero attacks, Discover a Druid card. Reduce its Cost by your hero's Attack.
 */
import { CardIds, GameFormat, GameType } from '@firestone-hs/reference-data';

import { isCardValidForGame } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const AvatarOfHearthstone: StaticGeneratingCard = {
	cardIds: [CardIds.AvatarOfHearthstone_CORE_WON_145, CardIds.AvatarOfHearthstone_WON_145],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const standardCards = input.allCards
			.getCards()
			.filter((c) => isCardValidForGame(c, GameFormat.FT_STANDARD, GameType.GT_RANKED));
		return standardCards.map((c) => c.id);
	},
};
