import { Card, MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { Events } from '../../events.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CardsInternalService extends AbstractCollectionInternalService<Card> {
	protected type = () => 'cards';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCardsCount;
	protected memoryReadingOperation = () => this.memoryReading.getCollection();
	protected isMemoryInfoEmpty = (collection: readonly Card[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getCollection();
	protected localDbSaveOperation = (collection: readonly Card[]) => this.db.saveCollection(collection);

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
