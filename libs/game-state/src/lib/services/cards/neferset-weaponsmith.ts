/* eslint-disable no-mixed-spaces-and-tabs */
// Neferset Weaponsmith (TLC_516): 4 Mana 5/4
// "[x]<b>Battlecry:</b> Get a random weapon from another class. <b>Combo:</b> Give it +2 Attack."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.WEAPON) && fromAnotherClass(c, currentClass);

export const NefersetWeaponsmith: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NefersetWeaponsmith_TLC_516],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			NefersetWeaponsmith.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			NefersetWeaponsmith.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.WEAPON, possibleCards };
	},
};
