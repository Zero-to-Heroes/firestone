import { MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { Events } from '../../events.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class BgHeroSkinsInternalService extends AbstractCollectionInternalService<number> {
	protected type = () => 'bg-hero-skins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionBgHeroSkinsCount;
	protected memoryReadingOperation = () => this.memoryReading.getBattlegroundsOwnedHeroSkinDbfIds();
	protected isMemoryInfoEmpty = (collection: readonly number[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getBattlegroundsOwnedHeroSkinDbfIds();
	protected localDbSaveOperation = (collection: readonly number[]) =>
		this.db.saveBattlegroundsOwnedHeroSkinDbfIds(collection);

	constructor(
		protected readonly events: Events,
		protected readonly scene: SceneService,
		protected readonly memoryUpdates: MemoryUpdatesService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events, scene, memoryUpdates);
	}
}
