/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lotus Agents
 * 3-cost 3/3 Minion
 * Battlecry: Discover a Druid, Rogue, or Shaman card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const LOTUS_CLASSES = [CardClass.DRUID, CardClass.ROGUE, CardClass.SHAMAN];

const isLotusCard = (classes: readonly string[] | undefined): boolean => {
	if (!classes) {
		return false;
	}
	return LOTUS_CLASSES.some((cls) => classes.includes(CardClass[cls]));
};

export const LotusAgents: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LotusAgents, CardIds.LotusAgents_WON_332],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			LotusAgents.cardIds[0],
			input.allCards,
			(c) => isLotusCard(c.classes) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			LotusAgents.cardIds[0],
			input.allCards,
			(c) => isLotusCard(c.classes) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardClasses: LOTUS_CLASSES,
			possibleCards: possibleCards,
		};
	},
};
