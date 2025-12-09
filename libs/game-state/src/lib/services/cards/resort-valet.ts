/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, ReferenceCard, sets, SetId } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const getValidSets = (): readonly SetId[] => {
	const latestExpansion = sets[0];
	return [latestExpansion.id, latestExpansion.miniSetFor].filter((s): s is SetId => !!s);
};

const isFromLatestExpansion = (c: ReferenceCard): boolean => {
	const validSets = getValidSets();
	return !!c.set && validSets.some((s) => c.set?.toLowerCase() === s.toLowerCase());
};

export const ResortValet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ResortValet_VAC_432],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			ResortValet.cardIds[0],
			input.allCards,
			(c) => isFromLatestExpansion(c) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			possibleCards: filterCards(
				ResortValet.cardIds[0],
				input.allCards,
				(c) => isFromLatestExpansion(c) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
