/* eslint-disable no-mixed-spaces-and-tabs */
// Sethekk Veilweaver (BT_254): 2 Mana 2/3
// "[x]After you cast a spell on a minion, add a Priest spell to your hand."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.PRIEST);

export const SethekkVeilweaver: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SethekkVeilweaver],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SethekkVeilweaver.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SethekkVeilweaver.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.PRIEST], possibleCards };
	},
};
