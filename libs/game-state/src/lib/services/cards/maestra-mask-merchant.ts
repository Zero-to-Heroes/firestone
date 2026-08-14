/* eslint-disable no-mixed-spaces-and-tabs */
// Maestra, Mask Merchant (VAC_336): 2 Mana 3/2
// "<b>Battlecry:</b> <b>Discover</b> a different class Hero card from the past."

import { CardIds, CardType, GameFormat } from '@firestone-hs/reference-data';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { isCardValidForGame } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const MaestraMaskMerchant: StaticGeneratingCard = {
	cardIds: [CardIds.MaestraMaskMerchant_VAC_336],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		input.allCards
			.getCards()
			.filter((c) => c.collectible)
			.filter((c) => c?.type?.toUpperCase() === CardType[CardType.HERO])
			.filter((c) => !c.id?.startsWith('DRG_'))
			.filter((c) =>
				!!c.set
					? !isCardValidForGame(c, GameFormat.FT_STANDARD, input.inputOptions.gameType) &&
						isCardValidForGame(c, GameFormat.FT_WILD, input.inputOptions.gameType)
					: false,
			)
			.filter((c) => fromAnotherClass(c, input.inputOptions.currentClass))
			.sort(
				(a, b) =>
					(a.cost ?? 0) - (b.cost ?? 0) ||
					a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
					a.name.localeCompare(b.name),
			)
			.map((c) => c.id),
};
