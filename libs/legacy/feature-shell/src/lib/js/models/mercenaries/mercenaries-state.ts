import { AppInjector } from '../../services/app-injector';
import { LazyDataInitService } from '../../services/lazy-data-init.service';
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
	// Merc-specific collection info from the game's memory
	readonly collectionInfo: MemoryMercenariesCollectionInfo;
	readonly mapInfo: MemoryMercenariesInfo;
	readonly visitorsInfo: readonly MemoryVisitor[];

	readonly referenceData: MercenariesReferenceData = undefined;
	readonly globalStats: MercenariesGlobalStats = undefined;

	readonly initComplete: boolean = false;

	public static create(base: MercenariesState): MercenariesState {
		return Object.assign(new MercenariesState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MercenariesState>>): MercenariesState {
		return Object.assign(new MercenariesState(), this, base, { uuid: this['uuid'] });
	}

	public getGlobalStats(): MercenariesGlobalStats {
		if (!this.initComplete) {
			return this.globalStats;
		}
		if (this.globalStats === undefined) {
			console.log('mercs global stats not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.globalStats as MercenariesGlobalStats) = null;
				service.requestLoad('mercenaries-global-stats');
			}
		}
		return this.globalStats;
	}

	public getReferenceData(): MercenariesReferenceData {
		if (!this.initComplete) {
			return this.referenceData;
		}
		if (this.referenceData === undefined) {
			console.log('[merc-ref] mercs referenceData not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.referenceData as MercenariesReferenceData) = null;
				service.requestLoad('mercenaries-reference-data');
			}
		}
		return this.referenceData;
	}
}
