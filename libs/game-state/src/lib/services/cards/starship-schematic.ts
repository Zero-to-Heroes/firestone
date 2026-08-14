/* eslint-disable no-mixed-spaces-and-tabs */
// Starship Schematic (GDB_102): 1 Mana
// "<b>Discover</b> a <b>Starship Piece</b> from another class. It costs (1) less."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.STARSHIP_PIECE) && fromAnotherClass(c, currentClass);

export const StarshipSchematic: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StarshipSchematic_GDB_102],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			StarshipSchematic.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			StarshipSchematic.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.STARSHIP_PIECE], possibleCards };
	},
};
