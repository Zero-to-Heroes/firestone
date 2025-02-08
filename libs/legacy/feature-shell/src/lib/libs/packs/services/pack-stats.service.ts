import { Injectable } from '@angular/core';
import { BoosterType, CardIds, getDefaultBoosterIdForSetId } from '@firestone-hs/reference-data';
import { CardPackResult, PackCardInfo, PackResult } from '@firestone-hs/user-packs';
import { ICollectionPackService } from '@firestone/collection/common';
import { DiskCacheService } from '@firestone/shared/common/service';
import { ApiRunner, COLLECTION_PACK_STATS, IndexedDbService, OverwolfService } from '@firestone/shared/framework/core';
import { InternalCardInfo } from '../../../js/models/collection/internal-card-info';
import { SetsService } from '../../../js/services/collection/sets-service.service';
import { Events } from '../../../js/services/events.service';
import { CollectionPacksUpdatedEvent } from '../../../js/services/mainwindow/store/events/collection/colection-packs-updated-event';
import { AppUiStoreFacadeService } from '../../../js/services/ui-store/app-ui-store-facade.service';

const PACKS_UPDATE_URL = 'https://zbfdquy6qvpmragkcwjzpr3v5a0bcgfn.lambda-url.us-west-2.on.aws/';
const PACKS_RETRIEVE_URL = 'https://dwfrvwcatnkfohkhcksuxweoii0mtgch.lambda-url.us-west-2.on.aws/';

@Injectable()
export class PackStatsService implements ICollectionPackService {
	constructor(
		private readonly events: Events,
		private readonly allCards: SetsService,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly diskCache: DiskCacheService,
		private readonly store: AppUiStoreFacadeService,
		private readonly indexedDb: IndexedDbService,
	) {
		this.events.on(Events.NEW_PACK).subscribe((event) => this.publishPackStat(event));
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		let existingPackStats = (await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).toArray()).sort(
			(a, b) => b.creationDate - a.creationDate,
		) as readonly PackResult[];
		console.debug('[pack-stats] existing pack stats in db', existingPackStats);
		if (!existingPackStats?.length) {
			const localResult = await this.diskCache.getItem<LocalPackStats>(
				DiskCacheService.DISK_CACHE_KEYS.COLLECTION_PACK_STATS,
			);
			console.debug('[pack-stats] existing pack stats in cache', localResult);
			if (localResult?.packs?.length) {
				existingPackStats = localResult.packs
					.filter((p) => !!p.id)
					.sort((a, b) => b.creationDate - a.creationDate);
				await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).bulkAdd(existingPackStats);
				console.debug('[pack-stats] added local pack stats to db', existingPackStats);
			}
		}

		if (!existingPackStats?.length) {
			console.debug('[pack-stats] no pack stats found, loading from remote');
			existingPackStats = await this.loadPacksFromRemote();
		}

		return existingPackStats;
	}

	public async refreshPackStats() {
		const packs: readonly PackResult[] = await this.loadPacksFromRemote();
		this.store.send(new CollectionPacksUpdatedEvent(packs));
	}

	private async loadPacksFromRemote(): Promise<readonly PackResult[]> {
		const user = await this.ow.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
		};
		const data: { results: readonly PackResult[] } = await this.api.callPostApi<{ results: readonly PackResult[] }>(
			PACKS_RETRIEVE_URL,
			input,
		);
		const packs: readonly PackResult[] = (data.results ?? [])
			.map((pack) => this.buildPackResult(pack))
			.filter((pack) => !!pack.cards?.length)
			// Because of how pack logging used to work, when you received the 5 galakrond cards,
			// the app flagged that as a new pack
			.filter((pack) => !this.isPackAllGalakronds(pack))
			.map((pack: PackResult) =>
				!!pack.boosterId
					? pack
					: {
							...pack,
							boosterId: getDefaultBoosterIdForSetId(pack.setId),
					  },
			)
			.sort((a, b) => b.creationDate - a.creationDate);
		if (packs.length) {
			await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).clear();
			await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).bulkAdd(packs);
			console.debug('[pack-stats] added remote pack stats to db', packs);
		}
		return packs;
	}

	private buildPackResult(pack: PackResult): PackResult {
		// console.debug('[pack-stats] building pack', pack);
		return {
			...pack,
			cards: !!pack.cards?.length ? pack.cards : this.buildCards(pack.cardsJson),
		};
	}

	private buildCards(cards: readonly PackCardInfo[]): readonly CardPackResult[] {
		return cards.map((card) => this.buildCard(card));
	}

	private buildCard(card: PackCardInfo): CardPackResult {
		return {
			...card,
			cardRarity: (this.allCards.getCard(card.cardId).rarity?.toLowerCase() ??
				this.allCards.getCard(card.mercenaryCardId)?.rarity?.toLowerCase()) as
				| 'common'
				| 'rare'
				| 'epic'
				| 'legendary',
			cardType: card.cardType as 'NORMAL' | 'GOLDEN' | 'DIAMOND' | 'SIGNATURE',
		};
	}

	private async publishPackStat(event: any) {
		const setId = event.data[0];
		const cards: readonly InternalCardInfo[] = event.data[1];
		if (!cards?.length) {
			return;
		}
		const boosterId: BoosterType = event.data[2];
		const user = await this.ow.getCurrentUser();
		const statEvent = {
			creationDate: new Date(),
			setId: setId,
			boosterId: boosterId,
			userId: user.userId,
			userName: user.username,
			cardsJson: cards,
		};
		console.debug('[pack-stats] publishing pack stat', statEvent);
		this.api.callPostApi(PACKS_UPDATE_URL, statEvent);
		this.updateLocalPackStats(boosterId, setId, cards);
	}

	private async updateLocalPackStats(boosterId: BoosterType, setId: string, cards: readonly InternalCardInfo[]) {
		// The "id" field in indexedDb is a kind of auto-increment. How can I get the next value?
		const id = await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).count();
		const newPack: PackResult = {
			id: id,
			boosterId: boosterId,
			creationDate: Date.now(),
			setId: setId,
			cards: this.buildCards(cards),
			cardsJson: cards,
		};
		await this.indexedDb.table<PackResult, string>(COLLECTION_PACK_STATS).add(newPack);
	}

	private isPackAllGalakronds(pack: PackResult): boolean {
		return (
			pack.setId === 'dragons' &&
			pack.cards.map((card) => card.cardId).includes(CardIds.GalakrondTheUnspeakable) &&
			pack.cards.map((card) => card.cardId).includes(CardIds.GalakrondTheTempest) &&
			pack.cards.map((card) => card.cardId).includes(CardIds.GalakrondTheWretched) &&
			pack.cards.map((card) => card.cardId).includes(CardIds.GalakrondTheUnbreakable) &&
			pack.cards.map((card) => card.cardId).includes(CardIds.GalakrondTheNightmare)
		);
	}
}

interface LocalPackStats {
	readonly lastUpdateDate: Date;
	readonly packs: readonly PackResult[];
}
