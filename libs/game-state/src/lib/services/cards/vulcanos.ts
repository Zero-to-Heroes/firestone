import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Vulcanos: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.Vulcanos_PlumeOfVulcanosToken_CATA_488t,
		CardIds.Vulcanos_PlumeOfVulcanosToken_CATA_488t2,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.cardId,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Vulcanos.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.ELEMENTAL],
			possibleCards: possibleCards,
		};
	},
};
