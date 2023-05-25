import { COIN_IDS, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Coin } from '../../../models/coin';
import { CoinInfo } from '../../../models/memory/coin-info';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { CollectionStorageService } from '../collection-storage.service';
import { AbstractCollectionInternalService } from './base-is';

export class CoinsInternalService extends AbstractCollectionInternalService<Coin, CoinInfo> {
	private refCoins: readonly ReferenceCard[];

	protected type = () => 'coins';
	protected memoryInfoCountExtractor = (update: MemoryUpdate) => update.CollectionCoinsCount;
	protected memoryReadingOperation = () => this.memoryReading.getCoins();
	protected localDbRetrieveOperation = () => this.db.getCoins();
	protected localDbSaveOperation = (collection: readonly Coin[]) => this.db.saveCoins(collection);

	constructor(
		protected readonly events: Events,
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: CollectionStorageService,
		private readonly allCards: CardsFacadeService,
	) {
		super(events);
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
