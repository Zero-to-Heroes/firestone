import { BoosterType } from '@firestone-hs/reference-data';

export interface PackInfo {
	readonly packType: BoosterType;
	readonly totalObtained: number;
	readonly unopened: number;
}
