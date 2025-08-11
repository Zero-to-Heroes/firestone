import { BoosterType } from '@firestone-hs/reference-data';

/** @deprecated use PackInfoForCollection from @firestone/memory instead */
export interface PackInfo {
	readonly packType: BoosterType;
	readonly totalObtained: number;
	readonly unopened: number;
}
