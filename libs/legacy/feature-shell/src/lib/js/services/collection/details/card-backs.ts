import { ApiRunner } from '@firestone/shared/framework/core';
import { CardBack } from '../../../models/card-back';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

const CARD_BACKS_URL = 'https://static.zerotoheroes.com/hearthstone/data/card-backs.json';

export class CardBacksInternalService extends AbstractCollectionInternalService<CardBack> {
	private referenceCardBacks: readonly CardBack[];

	protected type = () => 'card-backs';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCardBacksCount;
	protected memoryReadingOperation = () => this.memoryReading.getCardBacks();
	protected localDbRetrieveOperation = () => this.db.getCardBacks();
	protected localDbSaveOperation = (collection: readonly CardBack[]) => this.db.saveCardBacks(collection);

	constructor(
		protected readonly events: Events,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly api: ApiRunner,
	) {
		super(events);
	}

	protected async preInit(): Promise<void> {
		this.referenceCardBacks = (await this.api.callGetApi(CARD_BACKS_URL)) ?? [];
	}

	protected override updateMemoryInfo(collection: readonly CardBack[]): readonly CardBack[] {
		return this.mergeCardBacksData(this.referenceCardBacks, collection);
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
