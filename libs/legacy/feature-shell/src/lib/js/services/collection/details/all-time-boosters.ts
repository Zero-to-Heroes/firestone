import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { PackInfo } from '../../../models/collection/pack-info';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';

export class AllTimeBoostersInternalService {
	public collection$$ = new BehaviorSubject<readonly PackInfo[]>([]);

	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		const collectionUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			filter((event) => event.data[0].BoostersCount != null),
			map((event) => {
				const changes: MemoryUpdate = event.data[0];
				// console.debug('[collection-manager] [all-time-boosters] count changed', changes.BoostersCount);
				return changes.BoostersCount;
			}),
		);
		collectionUpdate$.pipe(debounceTime(5000), distinctUntilChanged()).subscribe(async (newCount) => {
			const collection = await this.memoryReading.getBoostersInfo();
			if (!!collection?.length) {
				console.debug(
					'[collection-manager] [all-time-boosters] updating collection',
					newCount,
					collection.length,
				);
				this.collection$$.next(collection);
			}
		});
		this.collection$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
			console.debug('[collection-manager] [all-time-boosters] updating collection in db', collection.length);
			await this.db.saveAllTimeBoosters(collection);
		});
		const collectionFromDb = await this.db.getAllTimeBoosters();
		if (collectionFromDb?.length) {
			console.debug('[collection-manager] [all-time-boosters] init collection from db', collectionFromDb.length);
			this.collection$$.next(collectionFromDb);
		}
	}

	public async getCollection(): Promise<readonly PackInfo[]> {
		return this.collection$$.getValue();
	}
}
