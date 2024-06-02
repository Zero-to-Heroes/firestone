import { PackInfo } from '@firestone/collection/view';
import { MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { Events } from '../../events.service';
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
		protected readonly memoryUpdates: MemoryUpdatesService,
		protected readonly gameStatus: GameStatusService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events, scene, memoryUpdates, gameStatus);
	}
}
