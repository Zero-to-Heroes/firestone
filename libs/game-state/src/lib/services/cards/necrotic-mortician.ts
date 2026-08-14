/* eslint-disable no-mixed-spaces-and-tabs */
// Necrotic Mortician (RLK_116 / CORE_RLK_116): 2 Mana 2/3
// "<b>Battlecry:</b> If a friendly Undead died after your last turn, <b>Discover</b> an Unholy Rune card."

import { CardIds, DkruneTypes, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRune } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectRune(c, DkruneTypes.UNHOLYRUNE);

export const NecroticMortician: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NecroticMortician, CardIds.NecroticMortician_CORE_RLK_116],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(NecroticMortician.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(NecroticMortician.cardIds[0], input.allCards, isMatch, input.options);
		return { possibleCards };
	},
};
