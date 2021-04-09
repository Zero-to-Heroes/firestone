import { Injectable } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { Coin } from '../../models/coin';
import { PackInfo } from '../../models/collection/pack-info';
import { CoinInfo } from '../../models/memory/coin-info';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { IndexedDbService } from './indexed-db.service';

const CARD_BACKS_URL = 'https://static.zerotoheroes.com/hearthstone/data/card-backs.json?v=4';
const CARD_PACKS_URL = 'https://api.firestoneapp.com/retrieveUserPackStats/packStats';

@Injectable()
export class CollectionManager {
	private referenceCardBacks: readonly CardBack[];

	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: IndexedDbService,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly allCards: AllCardsService,
	) {
		this.init();
	}

	public async getCollection(skipMemoryReading = false): Promise<Card[]> {
		console.log('[collection-manager] getting collection');
		const collection = !skipMemoryReading ? await this.memoryReading.getCollection() : null;
		// console.debug('[collection-manager] got collection', collection);
		if (!collection || collection.length === 0) {
			console.log('[collection-manager] retrieving collection from db');
			const collectionFromDb = await this.db.getCollection();
			console.log('[collection-manager] retrieved collection from db', collectionFromDb.length);
			return collectionFromDb;
		} else {
			console.log('[collection-manager] retrieved collection from MindVision, updating collection in db');
			const savedCollection = await this.db.saveCollection(collection);
			return savedCollection;
		}
	}

	public async getPacks(): Promise<readonly PackInfo[]> {
		console.log('[collection-manager] getting pack info');
		const packInfo = (await this.memoryReading.getBoostersInfo()) ?? [];
		console.log('[collection-manager] retrieved pack info from memory', packInfo?.length);
		if (!packInfo || packInfo.length === 0) {
			console.log('[collection-manager] retrieving pack info from db');
			const packsFromDb = await this.db.getPackInfos();
			console.log('[collection-manager] retrieved pack info from db', packsFromDb.length);
			return packsFromDb;
		} else {
			const saved = await this.db.savePackInfos(packInfo);
			return saved;
		}
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		const user = await this.ow.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
		};
		const data: any = (await this.api.callPostApiWithRetries<any>(CARD_PACKS_URL, input, 3)) ?? [];
		//console.debug('loaded pack stats', data);
		return (
			data.results
				// Because of how pack logging used to work, when you received the 5 galakrond cards,
				// the app flagged that as a new pack
				.filter(pack => !this.isPackAllGalakronds(pack))
		);
	}

	private isPackAllGalakronds(pack: PackResult): boolean {
		return (
			pack.setId === 'dragons' &&
			pack.cards.map(card => card.cardId).includes(CardIds.Collectible.Priest.GalakrondTheUnspeakable) &&
			pack.cards.map(card => card.cardId).includes(CardIds.Collectible.Shaman.GalakrondTheTempest) &&
			pack.cards.map(card => card.cardId).includes(CardIds.Collectible.Warlock.GalakrondTheWretched) &&
			pack.cards.map(card => card.cardId).includes(CardIds.Collectible.Warrior.GalakrondTheUnbreakable) &&
			pack.cards.map(card => card.cardId).includes(CardIds.Collectible.Rogue.GalakrondTheNightmare)
		);
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		console.log('[collection-manager] getting reference card backs');
		this.referenceCardBacks =
			this.referenceCardBacks ?? (await this.api.callGetApiWithRetries(CARD_BACKS_URL)) ?? [];
		console.log('[collection-manager] getting card backs', this.referenceCardBacks?.length);
		const cardBacks = await this.memoryReading.getCardBacks();
		console.log('[collection-manager] retrieved card backs from MindVision', cardBacks?.length);
		if (!cardBacks || cardBacks.length === 0) {
			console.log('[collection-manager] retrieving card backs from db');
			const cardBacksFromDb = await this.db.getCardBacks();
			console.log('[collection-manager] retrieved card backs from db', cardBacksFromDb.length);
			console.debug('[collection-manager] card from db', cardBacksFromDb);
			// We do this so that if we update the reference, we still see them until the info
			// has been refreshed from the in-game memory
			const merged = this.mergeCardBacksData(this.referenceCardBacks, cardBacksFromDb);
			console.debug('[collection-manager] merged cards from db', merged);
			return merged;
		} else {
			const merged = this.mergeCardBacksData(this.referenceCardBacks, cardBacks);
			console.debug('[collection-manager] updating card backs in db', merged);
			const saved = await this.db.saveCardBacks(merged);
			return saved;
		}
	}

	public async getCoins(): Promise<readonly Coin[]> {
		console.log('[collection-manager] getting coin');
		const memoryCoins: readonly CoinInfo[] = await this.memoryReading.getCoins();
		if (!memoryCoins || memoryCoins.length === 0) {
			console.log('[collection-manager] retrieving coins from db');
			const coinsFromDb = await this.db.getCoins();
			console.log('[collection-manager] retrieved coins from db', coinsFromDb.length);
			return coinsFromDb;
		} else {
			const refCoins = this.allCards
				.getCards()
				.filter(card => card.name === 'The Coin')
				.filter(card => card.type === 'Spell');
			const coins: readonly Coin[] = refCoins.map(coin => ({
				cardId: coin.id,
				owned: memoryCoins.find(c => c.CoinId === coin.dbfId) != null,
				cardDbfId: coin.dbfId,
			}));
			console.log('[collection-manager] updating coins in db', coins);
			const saved = await this.db.saveCoins(coins);
			return saved;
		}
	}

	private mergeCardBacksData(
		referenceCardBacks: readonly CardBack[],
		ownedCardBacks: readonly CardBack[],
	): readonly CardBack[] {
		return referenceCardBacks.map(cardBack => {
			const owned = ownedCardBacks.find(cb => cb.id === cardBack.id);
			return owned?.owned
				? ({
						...cardBack,
						owned: true,
				  } as CardBack)
				: cardBack;
		});
	}

	// type is NORMAL or GOLDEN
	public inCollection(collection: Card[], cardId: string): Card {
		for (const card of collection) {
			if (card.id === cardId) {
				return card;
			}
		}
		return null;
	}

	private init() {
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if ((res.gameChanged || res.runningChanged) && (await this.ow.inGame())) {
				await Promise.all([this.getCollection(), this.getCardBacks(), this.getPacks()]);
			}
		});
	}
}
