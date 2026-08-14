/* eslint-disable no-mixed-spaces-and-tabs */
// Relentless Wrathguard (GDB_132): 3 Mana 4/2 DEMON
// "<b>Battlecry:</b> Deal 2 damage to an enemy minion. If it dies, <b>Discover</b> a Demon."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, currentClass);

export const RelentlessWrathguard: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RelentlessWrathguard_GDB_132],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RelentlessWrathguard.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RelentlessWrathguard.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
