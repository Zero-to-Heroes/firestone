import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard } from './_card.type';
import { DeepSpaceCurator } from './deep-space-curator';
import { DirdraRebelCaptain } from './dirdra-rebel-captain';

export const cardsInfoCache: { [cardId: string]: GeneratingCard } = {
	[CardIds.DirdraRebelCaptain_GDB_117]: DirdraRebelCaptain,
	[CardIds.DeepSpaceCurator_GDB_311]: DeepSpaceCurator,
};
