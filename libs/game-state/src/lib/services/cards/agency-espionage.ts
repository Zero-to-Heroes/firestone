/* eslint-disable no-mixed-spaces-and-tabs */
// Agency Espionage (WORK_004)
// 4-Cost Rogue Spell
// "Shuffle a card from each other class into your deck. They cost (1). Draw one."
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AgencyEspionage: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AgencyEspionage_WORK_004],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			AgencyEspionage.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AgencyEspionage.cardIds[0],
			input.allCards,
			(c) => fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
