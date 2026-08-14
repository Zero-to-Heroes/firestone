/* eslint-disable no-mixed-spaces-and-tabs */
// Emerald Portal (EDR_445pt3): Imbue Dragon Hero Power token
// Summons a random Dragon with Cost equal to the number of times you've Imbued.

import { CardIds, CardType, GameTag, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import {
	getPlayerOrOpponentControllerEntity,
	getPlayerTag,
	hasCorrectType,
	hasCost,
} from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EmeraldPortal: StaticGeneratingCard = {
	cardIds: [CardIds.BlessingOfTheDragon_EmeraldPortalToken_EDR_445pt3],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const imbues = Math.min(
			10,
			getPlayerTag(
				getPlayerOrOpponentControllerEntity(input.inputOptions.deckState, input.inputOptions.gameState),
				GameTag.IMBUES_THIS_GAME,
			),
		);
		return filterCards(
			EmeraldPortal.cardIds[0],
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && hasCost(c, '==', imbues),
			input.inputOptions,
		);
	},
};
