/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ZephrysOptions: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.DreamplannerZephrys_ExtravagantTourToken_WORK_027t2,
		CardIds.DreamplannerZephrys_HecticTourToken_WORK_027t3,
		CardIds.DreamplannerZephrys_ModestTourToken_WORK_027t1,
	],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.allCards
			.getCard(input.card.cardId)
			.relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id);
		return {
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return (
			input.allCards.getCard(input.cardId).relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id) ??
			[]
		);
	},
};
