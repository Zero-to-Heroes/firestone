import { Injectable } from '@angular/core';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { PackInfo } from '../../models/collection/pack-info';
import { LocalStorageService } from '../local-storage';

declare let amplitude;

@Injectable()
export class CollectionStorageService {
	constructor(private readonly localStorageService: LocalStorageService) {}

	public async saveCollection(collection: readonly Card[]): Promise<readonly Card[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_COLLECTION, collection);
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

	public async savePackInfos(packInfos: readonly PackInfo[]): Promise<readonly PackInfo[]> {
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
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_COLLECTION);
		return fromStorage ?? [];
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_CARD_BACKS);
		return fromStorage ?? [];
	}

	public async getPackInfos(): Promise<readonly PackInfo[]> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_PACK_INFOS);
		return fromStorage ?? [];
	}

	public async getCoins(): Promise<readonly Coin[]> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_COINS);
		return fromStorage ?? [];
	}

	public async saveCardHistory(history: CardHistory): Promise<CardHistory> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_CARDS_HISTORY);
		const historyList: readonly CardHistory[] = fromStorage ?? [];
		const newHistory = [history, ...historyList];
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_CARDS_HISTORY, newHistory);
		return history;
	}

	public async saveFullCardHistory(history: readonly CardHistory[]): Promise<readonly CardHistory[]> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_CARDS_HISTORY, history);
		return history ?? [];
	}

	public async countCardHistory(): Promise<number> {
		const fullHistory = await this.getAllCardHistory(0);
		return fullHistory.length;
	}

	public async getAllCardHistory(limit: number): Promise<readonly CardHistory[]> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_CARDS_HISTORY);
		if (!!fromStorage) {
			const result: readonly CardHistory[] = fromStorage ?? [];
			return result.slice(0, limit);
		}
		return [];
	}
}
