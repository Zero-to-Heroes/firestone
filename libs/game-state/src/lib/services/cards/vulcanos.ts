import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDiscoverableElemental = (c: ReferenceCard, currentClass: string | null | undefined) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.ELEMENTAL) &&
	canBeDiscoveredByClass(c, currentClass ?? undefined);

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
			(c) => isDiscoverableElemental(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Vulcanos.cardIds[0],
			input.allCards,
			(c) => isDiscoverableElemental(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.ELEMENTAL],
			possibleCards: possibleCards,
		};
	},
};
