/* eslint-disable no-mixed-spaces-and-tabs */
// Jungle Jammer (ETC_832): 4 Mana 4/2 Weapon
// "Deathrattle: Summon a random 1-Cost Beast. (Cast spells while equipped to improve!)"

import { CardIds, GameTag, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { getEntityTag } from '../parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const JungleJammer: StaticGeneratingCard = {
	cardIds: [CardIds.JungleJammer],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const entity = input.inputOptions.gameState?.parserState?.CurrentEntities?.get(input.entityId);
		const tagValue = getEntityTag(entity, GameTag.TAG_SCRIPT_DATA_NUM_1, 1);
		return filterCards(
			JungleJammer.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => c?.cost === tagValue && hasCorrectTribe(c, Race.BEAST),
			input.inputOptions,
		);
	},
};
