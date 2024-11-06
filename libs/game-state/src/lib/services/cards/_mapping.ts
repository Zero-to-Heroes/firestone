import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard } from './_card.type';
import { DirdraRebelCaptain } from './dirdra-rebel-captain';

export const cardsInfoCache: { [cardId: string]: GeneratingCard } = {
	[CardIds.DirdraRebelCaptain_GDB_117]: DirdraRebelCaptain,
};
