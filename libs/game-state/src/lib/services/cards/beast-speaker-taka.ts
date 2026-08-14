/* eslint-disable no-mixed-spaces-and-tabs */
// Beast Speaker Taka (DINO_430)
// "Deathrattle: Summon a random Legendary Beast with this minion's Attack and Health."

import {
	CardIds,
	CardRarity,
	CardType,
	GameTag,
	hasCorrectTribe,
	Race,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { hasAttack, hasCorrectRarity, hasCorrectType, hasHealth } from '../../related-cards/dynamic-pools';
import { getEnchantmentsForEntity, getEntityTag } from '../parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isLegendaryBeast = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const BeastSpeakerTaka: StaticGeneratingCard = {
	cardIds: [CardIds.BeastSpeakerTaka_DINO_430],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentEntities = input.inputOptions.gameState?.parserState?.CurrentEntities;
		const fullEntity = currentEntities?.get(input.entityId) ?? null;
		if (fullEntity) {
			const enchantments = getEnchantmentsForEntity(currentEntities, input.entityId).filter(
				(e) => e.CardId === CardIds.BeastSpeakerTaka_LegendaryMountEnchantment_DINO_430e,
			);
			const allAttacks: number[] = [];
			const allHealths: number[] = [];
			for (const enchantment of enchantments) {
				const gainedAttack = getEntityTag(enchantment, GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
				const gainedHealth = getEntityTag(enchantment, GameTag.TAG_SCRIPT_DATA_NUM_2, 0);
				if (gainedHealth) {
					allHealths.push(gainedHealth);
					allAttacks.push(gainedAttack);
				}
			}
			if (allHealths.length > 0) {
				const numberOfSummons = allHealths.length;
				return filterCards(
					BeastSpeakerTaka.cardIds[0],
					input.allCards,
					(c: ReferenceCard) =>
						isLegendaryBeast(c) &&
						Array.from({ length: numberOfSummons }).some(
							(_, i) => hasAttack(c, '==', allAttacks[i]) && hasHealth(c, '==', allHealths[i]),
						),
					input.inputOptions,
				);
			}
		}
		return filterCards(BeastSpeakerTaka.cardIds[0], input.allCards, isLegendaryBeast, input.inputOptions);
	},
};
