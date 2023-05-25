import { Card } from '../../../models/card';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CardsInternalService extends AbstractCollectionInternalService<Card> {
	protected type = () => 'cards';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCardsCount;
	protected memoryReadingOperation = () => this.memoryReading.getCollection();
	protected localDbRetrieveOperation = () => this.db.getCollection();
	protected localDbSaveOperation = (collection: readonly Card[]) => this.db.saveCollection(collection);

	constructor(
		protected readonly events: Events,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
	) {
		super(events);
	}
}
