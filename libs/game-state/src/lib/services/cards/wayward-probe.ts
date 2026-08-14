/* eslint-disable no-mixed-spaces-and-tabs */
// Wayward Probe (SC_500): 4 Mana 4/3 MECH
// "[x]<b>Battlecry and Deathrattle:</b> Get a random <b>Starship Piece</b>."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.STARSHIP_PIECE);

export const WaywardProbe: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WaywardProbe_SC_500],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WaywardProbe.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WaywardProbe.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.STARSHIP_PIECE], possibleCards };
	},
};
