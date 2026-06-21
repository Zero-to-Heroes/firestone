/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * P1CK-P0K3T (JAIL_456)
 * Battlecry: If your deck has 25 or more cards, draw a card.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const P1CKP0K3T: SelectorCard = {
	cardIds: [TempCardIds.P1CKP0K3T_JAIL_456 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck),
};
