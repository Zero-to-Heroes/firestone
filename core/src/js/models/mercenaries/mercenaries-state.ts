import { AppInjector } from '../../services/app-injector';
import { LazyDataInitService } from '../../services/lazy-data-init.service';
import {
	MercenariesGlobalStats,
	MercenariesReferenceData,
} from '../../services/mercenaries/mercenaries-state-builder.service';
import { NonFunctionProperties, uuid } from '../../services/utils';
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

	constructor() {
		this['uuid'] = uuid();
	}

	public static create(base: MercenariesState): MercenariesState {
		const result = Object.assign(new MercenariesState(), base);
		result['uuid'] = this['uuid'] ?? result['uuid'];
		console.debug('building merc state 2', result['uuid'], this['uuid'], new Error().stack);
		return result;
	}

	public update(base: Partial<NonFunctionProperties<MercenariesState>>): MercenariesState {
		const result = Object.assign(new MercenariesState(), this, base, { uuid: this['uuid'] });
		result['uuid'] = this['uuid'] ?? result['uuid'];
		console.debug('building merc state 3', result['uuid'], this['uuid'],new Error().stack);
		return result;
	}

	public getGlobalStats(): MercenariesGlobalStats {
		if (this.globalStats === undefined) {
			console.log(
				'mercs global stats not initialized yet',
				this.globalStats === undefined,
				this.globalStats === null,
				new Error().stack,
				this,
				window,
			);
			(this.globalStats as MercenariesGlobalStats) = null;
			console.log('set local stats to null', this.globalStats === undefined);
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('mercenaries-global-stats');
		}
		return this.globalStats;
	}

	public getReferenceData(): MercenariesReferenceData {
		if (this.referenceData === undefined) {
			console.log('mercs referenceData not initialized yet');
			(this.referenceData as MercenariesReferenceData) = null;
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('mercenaries-reference-data');
		}
		return this.referenceData;
	}
}
