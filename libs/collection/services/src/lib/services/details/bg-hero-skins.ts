import { MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { Events } from '@firestone/shared/common/service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class BgHeroSkinsInternalService extends AbstractCollectionInternalService<number> {
	protected type = () => 'bg-hero-skins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionBgHeroSkinsCount;
	protected memoryReadingOperation = async () =>
		(await this.memoryReading.getBattlegroundsOwnedHeroSkinDbfIds()) ?? [];
	protected isMemoryInfoEmpty = (collection: readonly number[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getBattlegroundsOwnedHeroSkinDbfIds();
	protected localDbSaveOperation = (collection: readonly number[]) =>
		this.db.saveBattlegroundsOwnedHeroSkinDbfIds(collection);

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
