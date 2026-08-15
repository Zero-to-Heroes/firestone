/* eslint-disable no-mixed-spaces-and-tabs */
// Sketchy Stranger (REV_945 / CORE_REV_945): 2 Mana 2/2 Neutral
// "<b>Battlecry:</b> <b>Discover</b> a <b>Secret</b> from another class."

import {
	ALL_CLASSES,
	CardClass,
	CardIds,
	CardType,
	GameTag,
	hasMechanic,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET) && fromAnotherClass(c, currentClass);

export const SketchyStranger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SketchyStranger, CardIds.SketchyStranger_CORE_REV_945],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SketchyStranger.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const otherClasses = ALL_CLASSES.filter((c) => c.toUpperCase() !== currentClass?.toUpperCase()).map(
			(c) => CardClass[c.toUpperCase() as keyof typeof CardClass],
		);
		const possibleCards = filterCards(
			SketchyStranger.cardIds[0],
			input.allCards,
			(c) => isMatch(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			cardClasses: otherClasses,
			possibleCards,
		};
	},
};
