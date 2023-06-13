import { PackInfo } from '@firestone/collection/view';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class AllTimeBoostersInternalService extends AbstractCollectionInternalService<PackInfo> {
	protected type = () => 'all-time-boosters';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.BoostersCount;
	protected memoryReadingOperation = () => this.memoryReading.getBoostersInfo();
	protected localDbRetrieveOperation = () => this.db.getAllTimeBoosters();
	protected localDbSaveOperation = (collection: readonly PackInfo[]) => this.db.saveAllTimeBoosters(collection);

	constructor(
		protected readonly events: Events,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events);
	}
}
