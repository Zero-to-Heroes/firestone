import { PackInfo } from '@firestone/collection/view';
import { MemoryUpdate } from '@firestone/memory';
import { Events } from '../../events.service';
import { SceneService } from '../../game/scene.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class AllTimeBoostersInternalService extends AbstractCollectionInternalService<PackInfo> {
	protected type = () => 'all-time-boosters';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.BoostersCount;
	protected memoryReadingOperation = () => this.memoryReading.getBoostersInfo();
	protected isMemoryInfoEmpty = (collection: readonly PackInfo[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getAllTimeBoosters();
	protected localDbSaveOperation = (collection: readonly PackInfo[]) => this.db.saveAllTimeBoosters(collection);

	constructor(
		protected readonly events: Events,
		protected readonly scene: SceneService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events, scene);
	}
}
