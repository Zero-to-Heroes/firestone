import { Card, MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { Events } from '@firestone/shared/common/service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CardsInternalService extends AbstractCollectionInternalService<Card> {
	protected type = () => 'cards';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCardsCount;
	protected memoryReadingOperation = async () => (await this.memoryReading.getCollection()) ?? [];
	protected isMemoryInfoEmpty = (collection: readonly Card[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getCollection();
	protected localDbSaveOperation = (collection: readonly Card[]) => this.db.saveCollection(collection);

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
