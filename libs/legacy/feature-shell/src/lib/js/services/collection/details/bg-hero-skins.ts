import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class BgHeroSkinsInternalService extends AbstractCollectionInternalService<number> {
	protected type = () => 'bg-hero-skins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionBgHeroSkinsCount;
	protected memoryReadingOperation = () => this.memoryReading.getBattlegroundsOwnedHeroSkinDbfIds();
	protected localDbRetrieveOperation = () => this.db.getBattlegroundsOwnedHeroSkinDbfIds();
	protected localDbSaveOperation = (collection: readonly number[]) =>
		this.db.saveBattlegroundsOwnedHeroSkinDbfIds(collection);

	constructor(
		protected readonly events: Events,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events);
	}
}
