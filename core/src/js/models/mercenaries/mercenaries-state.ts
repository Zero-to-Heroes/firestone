import {
	MercenariesGlobalStats,
	MercenariesReferenceData,
} from '../../services/mercenaries/mercenaries-state-builder.service';
import { NonFunctionProperties } from '../../services/utils';
import { MemoryMercenariesCollectionInfo, MemoryVisitor } from '../memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../memory/memory-mercenaries-info';
import { MercenariesCategoryId } from './mercenary-category-id.type';
// import { MercenaryGlobalStats } from './mercenary-info';

export class MercenariesState {
	readonly loading: boolean = true;
	readonly categoryIds: MercenariesCategoryId[] = [];
	readonly globalStats: MercenariesGlobalStats;
	readonly referenceData: MercenariesReferenceData;
	// Merc-specific collection info from the game's memory
	readonly collectionInfo: MemoryMercenariesCollectionInfo;
	readonly mapInfo: MemoryMercenariesInfo;
	readonly visitorsInfo: readonly MemoryVisitor[];

	public static create(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesState>>): MercenariesState {
		return Object.assign(new MercenariesState(), this, base);
	}
}
