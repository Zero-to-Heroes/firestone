import { BehaviorSubject, debounceTime, filter, map } from 'rxjs';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';

export class BgHeroSkinsInternalService {
	public collection$$ = new BehaviorSubject<readonly number[]>([]);

	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		const collectionUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			filter((event) => event.data[0].CollectionBgHeroSkinsCount != null),
			map((event) => {
				const changes: MemoryUpdate = event.data[0];
				console.debug(
					'[collection-manager] [bg-hero-skins] cards count changed',
					changes.CollectionBgHeroSkinsCount,
					changes,
				);
				return changes.CollectionBgHeroSkinsCount;
			}),
		);
		collectionUpdate$.pipe(debounceTime(5000)).subscribe(async () => {
			const collection = await this.memoryReading.getBattlegroundsOwnedHeroSkinDbfIds();
			if (!!collection?.length) {
				console.debug('[collection-manager] [bg-hero-skins] updating collection', collection.length);
				this.collection$$.next(collection);
			}
		});
		this.collection$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
			console.debug('[collection-manager] [bg-hero-skins] updating collection in db', collection.length);
			await this.db.saveBattlegroundsOwnedHeroSkinDbfIds(collection);
		});
		const collectionFromDb = await this.db.getBattlegroundsOwnedHeroSkinDbfIds();
		if (collectionFromDb?.length) {
			console.debug('[collection-manager] [bg-hero-skins] init collection from db', collectionFromDb.length);
			this.collection$$.next(collectionFromDb);
		}
	}

	public async getCollection(): Promise<readonly number[]> {
		return this.collection$$.getValue();
	}
}
