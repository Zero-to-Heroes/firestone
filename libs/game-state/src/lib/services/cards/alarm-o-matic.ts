/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Alarm-O-Matic (JAIL_502)
 * At the start of your turn, swap this minion with a random one in your opponent's hand.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { Card, GeneratingCard } from './_card.type';

export const AlarmOMatic: Card & GeneratingCard = {
	cardIds: [CardIds.AlarmOMatic_JAIL_502],
	publicCreator: true,
};
