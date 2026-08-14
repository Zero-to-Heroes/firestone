/* eslint-disable no-mixed-spaces-and-tabs */
// Hidden Objects (TOY_037): 2 Mana
// "<b>Discover</b> a <b>Secret</b>. Set its Cost to (1)."

import { CardIds, CardType, CardClass, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE);

export const HiddenObjects: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HiddenObjects_TOY_037],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(HiddenObjects.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(HiddenObjects.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, mechanics: [GameTag.SECRET], cardClasses: [CardClass.MAGE], possibleCards };
	},
};
