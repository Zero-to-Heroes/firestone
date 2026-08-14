/* eslint-disable no-mixed-spaces-and-tabs */
// Scrounging Shipwright (GDB_876): 2 Mana 3/2 DRAENEI
// "<b>Battlecry:</b> Get a random <b>Starship Piece</b> from another class."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.STARSHIP_PIECE) && fromAnotherClass(c, currentClass);

export const ScroungingShipwright: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ScroungingShipwright_GDB_876],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ScroungingShipwright.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ScroungingShipwright.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.STARSHIP_PIECE], possibleCards };
	},
};
