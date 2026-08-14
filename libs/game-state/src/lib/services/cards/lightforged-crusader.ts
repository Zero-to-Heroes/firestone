/* eslint-disable no-mixed-spaces-and-tabs */
// Lightforged Crusader (DRG_231): 7 Mana 7/7 DRAENEI
// "[x]<b>Battlecry:</b> If your deck has no Neutral cards, add 5 random Paladin cards to your hand."

import { CardIds, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectClass(c, CardClass.PALADIN);

export const LightforgedCrusader: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LightforgedCrusader],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(LightforgedCrusader.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(LightforgedCrusader.cardIds[0], input.allCards, isMatch, input.options);
		return { cardClasses: [CardClass.PALADIN], possibleCards };
	},
};
