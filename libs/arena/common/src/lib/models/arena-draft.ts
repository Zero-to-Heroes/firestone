import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { BnetRegion } from '@firestone-hs/reference-data';

export interface ExtendedDraftDeckStats extends DraftDeckStats {
	readonly region: BnetRegion | null;
	readonly gameMode: 'arena' | 'arena-underground';
}
