import { COIN_IDS, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CoinInfo, MemoryInspectionService, MemoryUpdate, MemoryUpdatesService } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Coin } from '../../../models/coin';
import { Events } from '../../events.service';
import { SceneService } from '../../game/scene.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CoinsInternalService extends AbstractCollectionInternalService<Coin, CoinInfo> {
	private refCoins: readonly ReferenceCard[];

	protected type = () => 'coins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCoinsCount;
	protected memoryReadingOperation = () => this.memoryReading.getCoins();
	protected isMemoryInfoEmpty = (collection: readonly CoinInfo[]) => !collection?.length;
	protected localDbRetrieveOperation = () => this.db.getCoins();
	protected localDbSaveOperation = (collection: readonly Coin[]) => this.db.saveCoins(collection);

	constructor(
		protected readonly events: Events,
		protected readonly scene: SceneService,
		protected readonly memoryUpdates: MemoryUpdatesService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly allCards: CardsFacadeService,
	) {
		super(events, scene, memoryUpdates);
	}

	protected override async preInit(): Promise<void> {
		this.refCoins = this.allCards.getCards().filter((card) => COIN_IDS.includes(card.id as CardIds));
	}

	protected override updateMemoryInfo(collection: readonly CoinInfo[]): readonly Coin[] {
		return this.refCoins.map((coin) => ({
			cardId: coin.id,
			owned: collection.find((c) => c.CoinId === coin.dbfId) != null,
			cardDbfId: coin.dbfId,
		}));
	}
}
