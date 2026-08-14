/* eslint-disable no-mixed-spaces-and-tabs */
// Kaldorei Cultivator (TIME_730): 2 Mana 2/3
// "Battlecry: Discover 2 Beasts. Put them on the bottom of your deck with +5/+5."
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && canBeDiscoveredByClass(c, currentClass);

export const KaldoreiCultivator: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.KaldoreiCultivator_TIME_730],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			KaldoreiCultivator.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.BEAST],
			possibleCards: filterCards(
				KaldoreiCultivator.cardIds[0],
				input.allCards,
				(c) => isMatch(c, input.options.currentClass),
				input.options,
			),
		};
	},
};
