import {
	MemoryInspectionService,
	MemoryUpdate,
	MemoryUpdatesService,
	PackInfoForCollection as PackInfo,
	SceneService,
} from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { Events } from '@firestone/shared/common/service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class AllTimeBoostersInternalService extends AbstractCollectionInternalService<PackInfo> {
	protected type = () => 'all-time-boosters';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.BoostersCount;
	protected memoryReadingOperation = async () => (await this.memoryReading.getBoostersInfo()) ?? [];
	protected isMemoryInfoEmpty = (collection: readonly PackInfo[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getAllTimeBoosters();
	protected localDbSaveOperation = (collection: readonly PackInfo[]) =>
		this.db.saveAllTimeBoosters(collection);

	constructor(
		protected override readonly events: Events,
		protected override readonly scene: SceneService,
		protected override readonly memoryUpdates: MemoryUpdatesService,
		protected override readonly gameStatus: GameStatusService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events, scene, memoryUpdates, gameStatus);
	}
}
