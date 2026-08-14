/* eslint-disable no-mixed-spaces-and-tabs */
// Orbital Satellite (GDB_462): 1 Mana
// "[x]<b>Discover</b> a Draenei. If you played an adjacent card this turn, <b>Discover</b> another."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAENEI) && canBeDiscoveredByClass(c, currentClass);

export const OrbitalSatellite: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.OrbitalSatellite_GDB_462],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			OrbitalSatellite.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			OrbitalSatellite.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAENEI], possibleCards };
	},
};
