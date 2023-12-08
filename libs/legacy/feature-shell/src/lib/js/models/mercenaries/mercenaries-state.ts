import { MemoryVisitor } from '@firestone/memory';
import { NonFunctionProperties } from '../../services/utils';
import { MercenariesCategoryId } from './mercenary-category-id.type';
// import { MercenaryGlobalStats } from './mercenary-info';

export class MercenariesState {
	readonly loading: boolean = false;
	readonly initComplete: boolean = true;
	readonly categoryIds: MercenariesCategoryId[] = ['mercenaries-personal-hero-stats', 'mercenaries-my-teams'];
	// Merc-specific collection info from the game's memory
	// readonly collectionInfo: MemoryMercenariesCollectionInfo;
	// readonly mapInfo: MemoryMercenariesInfo;
	readonly visitorsInfo: readonly MemoryVisitor[];

	// readonly referenceData: MercenariesReferenceData = undefined;
	// readonly globalStats: MercenariesGlobalStats = undefined;

	public static create(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesState>>): MercenariesState {
		return Object.assign(new MercenariesState(), this, base, { uuid: this['uuid'] });
	}
}
