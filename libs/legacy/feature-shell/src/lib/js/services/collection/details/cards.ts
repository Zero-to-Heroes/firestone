import { BehaviorSubject, debounceTime, filter, map } from 'rxjs';
import { Card } from '../../../models/card';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';

export class CardsInternalService {
	public collection$$ = new BehaviorSubject<readonly Card[]>([]);

	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		const collectionUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			filter((event) => event.data[0].CollectionCardsCount != null),
			map((event) => {
				const changes: MemoryUpdate = event.data[0];
				console.debug(
					'[collection-manager] [cards] cards count changed',
					changes.CollectionCardsCount,
					changes,
				);
				return changes.CollectionCardBacksCount;
			}),
		);
		collectionUpdate$.pipe(debounceTime(5000)).subscribe(async () => {
			const collection = await this.memoryReading.getCollection();
			if (!!collection?.length) {
				console.debug('[collection-manager] [cards] updating collection', collection.length);
				this.collection$$.next(collection);
			}
		});
		this.collection$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
			console.debug('[collection-manager] [cards] updating collection in db', collection.length);
			await this.db.saveCollection(collection);
		});
		const collectionFromDb = await this.db.getCollection();
		if (collectionFromDb?.length) {
			console.debug('[collection-manager] [cards] init collection from db', collectionFromDb.length);
			this.collection$$.next(collectionFromDb);
		}
	}

	public async getCollection(): Promise<readonly Card[]> {
		return this.collection$$.getValue();
	}
}
