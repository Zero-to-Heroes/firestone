import { isCoin, ReferenceCard } from '@firestone-hs/reference-data';
import {
	CoinInfo,
	MemoryInspectionService,
	MemoryUpdate,
	MemoryUpdatesService,
	SceneService,
} from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Events } from '@firestone/shared/common/service';
import { Coin } from '../../model/coin';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CoinsInternalService extends AbstractCollectionInternalService<Coin, CoinInfo> {
	private refCoins: readonly ReferenceCard[];

	protected type = () => 'coins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCoinsCount;
	protected memoryReadingOperation = async () => (await this.memoryReading.getCoins()) ?? [];
	protected isMemoryInfoEmpty = (collection: readonly CoinInfo[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getCoins();
	protected localDbSaveOperation = (collection: readonly Coin[]) => this.db.saveCoins(collection);

	constructor(
		protected override readonly events: Events,
		protected override readonly scene: SceneService,
		protected override readonly memoryUpdates: MemoryUpdatesService,
		protected override readonly gameStatus: GameStatusService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly allCards: CardsFacadeService,
	) {
		super(events, scene, memoryUpdates, gameStatus);
	}

	protected override async preInit(): Promise<void> {
		this.refCoins = this.allCards.getCards().filter((card) => isCoin(card.id, this.allCards));
	}

	protected override updateMemoryInfo(collection: readonly CoinInfo[]): readonly Coin[] {
		return this.refCoins.map((coin) => ({
			cardId: coin.id,
			owned: collection.find((c) => c.CoinId === coin.dbfId) != null,
			cardDbfId: coin.dbfId,
		}));
	}
}
