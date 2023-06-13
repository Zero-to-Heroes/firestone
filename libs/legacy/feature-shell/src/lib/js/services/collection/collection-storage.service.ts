import { Injectable } from '@angular/core';
import { PackInfo } from '@firestone/collection/view';
import { DiskCacheService, LocalStorageService } from '@firestone/shared/framework/core';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';

declare let amplitude;

@Injectable()
export class CollectionStorageService {
	constructor(
		private readonly localStorageService: LocalStorageService,
		private readonly diskCache: DiskCacheService,
	) {}

	public async saveCollection(collection: readonly Card[]): Promise<readonly Card[]> {
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.COLLECTION, collection);
		return collection;
	}

	public async saveBattlegroundsOwnedHeroSkinDbfIds(collection: readonly number[]): Promise<readonly number[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_BGS_HERO_SKIN_IDS, collection);
		return collection;
	}

	public async saveCardBacks(cardBacks: readonly CardBack[]): Promise<readonly CardBack[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_CARD_BACKS, cardBacks);
		return cardBacks;
	}

	public async saveAllTimeBoosters(packInfos: readonly PackInfo[]): Promise<readonly PackInfo[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_PACK_INFOS, packInfos);
		return packInfos;
	}

	public async saveCoins(coins: readonly Coin[]): Promise<readonly Coin[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_COINS, coins);
		return coins;
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[]> {
		return this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_BGS_HERO_SKIN_IDS) ?? [];
	}

	public async getCollection(): Promise<readonly Card[]> {
		const fromStorage = await this.diskCache.getItem<readonly Card[]>(DiskCacheService.DISK_CACHE_KEYS.COLLECTION);
		return fromStorage ?? [];
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		const fromStorage = this.localStorageService.getItem<readonly CardBack[]>(
			LocalStorageService.LOCAL_STORAGE_CARD_BACKS,
		);
		return fromStorage ?? [];
	}

	public async getAllTimeBoosters(): Promise<readonly PackInfo[]> {
		const fromStorage = this.localStorageService.getItem<readonly PackInfo[]>(
			LocalStorageService.LOCAL_STORAGE_PACK_INFOS,
		);
		return fromStorage ?? [];
	}

	public async getCoins(): Promise<readonly Coin[]> {
		const fromStorage = this.localStorageService.getItem<readonly Coin[]>(LocalStorageService.LOCAL_STORAGE_COINS);
		return fromStorage ?? [];
	}

	public async saveCardHistory(history: CardHistory): Promise<CardHistory> {
		const fromStorage = await this.diskCache.getItem<readonly CardHistory[]>(
			DiskCacheService.DISK_CACHE_KEYS.CARDS_HISTORY,
		);
		const historyList: readonly CardHistory[] = fromStorage ?? [];
		const newHistory = [history, ...historyList];
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.CARDS_HISTORY, newHistory);
		return history;
	}

	public async saveFullCardHistory(history: readonly CardHistory[]): Promise<readonly CardHistory[]> {
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.CARDS_HISTORY, history);
		return history ?? [];
	}

	public async countCardHistory(): Promise<number> {
		const fullHistory = await this.getAllCardHistory(0);
		return fullHistory.length;
	}

	public async getAllCardHistory(limit: number): Promise<readonly CardHistory[]> {
		const fromStorage = await this.diskCache.getItem<readonly CardHistory[]>(
			DiskCacheService.DISK_CACHE_KEYS.CARDS_HISTORY,
		);
		if (!!fromStorage) {
			const result: readonly CardHistory[] = fromStorage ?? [];
			return result.slice(0, limit);
		}
		return [];
	}
}
