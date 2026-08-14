/* eslint-disable no-mixed-spaces-and-tabs */
// Ranger Captain Alleria (TIME_609t1): 3 Mana 2/4
// "[x]<b>Battlecry:</b> <b>Discover</b> a spell. If you've played Sylvanas or Vereesa, repeat for each."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const RangerCaptainAlleria: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RangerGeneralSylvanas_RangerCaptainAlleriaToken_TIME_609t1],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RangerCaptainAlleria.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RangerCaptainAlleria.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
