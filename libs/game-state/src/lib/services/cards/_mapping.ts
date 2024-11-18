import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, UpdatingCard } from './_card.type';
import { DeepSpaceCurator } from './deep-space-curator';
import { DirdraRebelCaptain } from './dirdra-rebel-captain';
import { Kiljaeden } from './kiljaeden';
import { Metrognome } from './metrognome';
import { NorthernNavigation } from './northern-navigation';

export const cardsInfoCache: { [cardId: string]: GeneratingCard | UpdatingCard } = {
	[CardIds.DirdraRebelCaptain_GDB_117]: DirdraRebelCaptain,
	[CardIds.DeepSpaceCurator_GDB_311]: DeepSpaceCurator,
	[CardIds.Metrognome]: Metrognome,
	[CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e]: Kiljaeden,
	[CardIds.NorthernNavigation]: NorthernNavigation,
};
