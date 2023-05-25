import { ApiRunner } from '@firestone/shared/framework/core';
import { BehaviorSubject, debounceTime, filter, map } from 'rxjs';
import { CardBack } from '../../../models/card-back';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';

const CARD_BACKS_URL = 'https://static.zerotoheroes.com/hearthstone/data/card-backs.json';

export class CardBacksInternalService {
	private referenceCardBacks: readonly CardBack[];
	public cardBacks$$ = new BehaviorSubject<readonly CardBack[]>([]);

	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly api: ApiRunner,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		this.referenceCardBacks = (await this.api.callGetApi(CARD_BACKS_URL)) ?? [];
		const cardBacksUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
			filter((event) => event.data[0].CollectionCardBacksCount != null),
			map((event) => {
				const changes: MemoryUpdate = event.data[0];
				console.debug(
					'[collection-manager] [card-backs] card-backs count changed',
					changes.CollectionCardBacksCount,
					changes,
				);
				return changes.CollectionCardBacksCount;
			}),
		);
		cardBacksUpdate$.pipe(debounceTime(5000)).subscribe(async () => {
			const collection = await this.memoryReading.getCardBacks();
			if (!!collection?.length) {
				const merged = this.mergeCardBacksData(this.referenceCardBacks, collection);
				console.debug(
					'[collection-manager] [card-backs] updating collection',
					collection.length,
					merged.length,
				);
				this.cardBacks$$.next(merged);
			}
		});
		this.cardBacks$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
			console.debug('[collection-manager] [card-backs] updating collection in db', collection.length);
			await this.db.saveCardBacks(collection);
		});
		const cardBacksFromDb = await this.db.getCardBacks();
		if (cardBacksFromDb?.length) {
			console.debug('[collection-manager] [card-backs] init collection from db', cardBacksFromDb.length);
			this.cardBacks$$.next(cardBacksFromDb);
		}
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		return this.cardBacks$$.getValue();
	}

	private mergeCardBacksData(
		referenceCardBacks: readonly CardBack[],
		ownedCardBacks: readonly CardBack[],
	): readonly CardBack[] {
		return referenceCardBacks.map((cardBack) => {
			const owned = ownedCardBacks.find((cb) => cb.id === cardBack.id);
			return owned?.owned
				? ({
						...cardBack,
						owned: true,
				  } as CardBack)
				: cardBack;
		});
	}
}
