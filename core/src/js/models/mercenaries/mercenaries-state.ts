import {
	MercenariesGlobalStats,
	MercenariesReferenceData,
} from '../../services/mercenaries/mercenaries-state-builder.service';
import { MercenariesCategoryId } from './mercenary-category-id.type';
// import { MercenaryGlobalStats } from './mercenary-info';

export class MercenariesState {
	readonly loading: boolean = true;
	readonly categoryIds: MercenariesCategoryId[] = [];
	readonly globalStats: MercenariesGlobalStats;
	readonly referenceData: MercenariesReferenceData;

	public static create(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), base);
	}

	public update(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), this, base);
	}
}
