/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Onyxia's Wing (CATA_155t / CATA_155t1) — Colossal limb from Arisen Onyxia (CATA_155).
 * Text: When summoned, get a random 2-Cost minion. It costs Health this turn. Herald twice to upgrade.
 * The random minion mana band is stored in {@link GameTag.TAG_SCRIPT_DATA_NUM_1} (upgrades with Herald).
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { resolveStoredRandomMinionCost } from './stored-random-minion-cost';
import { filterCards } from './utils';

export const OnyxiasWing: StaticGeneratingCard = {
	cardIds: [CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t, CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t1],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = resolveStoredRandomMinionCost(input, input.cardId, {
			useCreatorEntityFallback: false,
		});
		return filterCards(
			OnyxiasWing.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
