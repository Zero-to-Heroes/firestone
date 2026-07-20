/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { and, beast, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const HeadhuntersHatchet: SelectorCard = {
	cardIds: [CardIds.HeadhuntersHatchet_CORE_TRL_111, CardIds.HeadhuntersHatchet_TRL_111],
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inDeck, inHand), beast),
};
