/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vigilant Sentry (JAIL_035)
 * Taunt. Battlecry: If your deck has no Neutral cards, summon two Vigilant Sentries.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, neutral, side } from '../card-highlight/selectors';

import { SelectorCard } from './_card.type';

export const VigilantSentry: SelectorCard = {
	cardIds: [CardIds.VigilantSentry_JAIL_035],
	selector: (inputSide) => and(side(inputSide), inDeck, neutral),
};
