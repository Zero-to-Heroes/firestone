import { Injectable } from '@angular/core';
import { BoosterType, CardIds, getDefaultBoosterIdForSetId } from '@firestone-hs/reference-data';
import { CardPackResult, PackCardInfo, PackResult } from '@firestone-hs/user-packs';
import { ICollectionPackService } from '@firestone/collection/common';
import { ApiRunner, DiskCacheService, OverwolfService } from '@firestone/shared/framework/core';
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
	) {
		this.events.on(Events.NEW_PACK).subscribe((event) => this.publishPackStat(event));
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		// Ideally this would be fully reactive, but there are too many processes that depend on it,
		// so for now I will just use a local cache
		const localPackResult = await this.diskCache.getItem<LocalPackStats>(
			DiskCacheService.DISK_CACHE_KEYS.COLLECTION_PACK_STATS,
		);
		// Cache the local results for one hour
		if (localPackResult && Date.now() - new Date(localPackResult.lastUpdateDate).getTime() <= 60 * 60 * 1000) {
			return localPackResult.packs;
		}

		const packs: readonly PackResult[] = await this.loadPacksFromRemote();
		return packs;
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
			.map((pack: PackResult) => {
				if (!!pack.boosterId) {
					return pack;
				}
				return {
					...pack,
					boosterId: getDefaultBoosterIdForSetId(pack.setId),
				};
			});
		const newPackResults: LocalPackStats = {
			lastUpdateDate: new Date(),
			packs: packs,
		};
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.COLLECTION_PACK_STATS, newPackResults);
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
		// for (let i = 0; i < cards.length; i++) {
		// 	statEvent['card' + (i + 1) + 'Id'] = cards[i].cardId?.toLowerCase();
		// 	statEvent['card' + (i + 1) + 'Type'] = cards[i].cardType?.toLowerCase();
		// 	const dbCard = this.allCards.getCard(cards[i].cardId);
		// 	statEvent['card' + (i + 1) + 'Rarity'] =
		// 		dbCard?.rarity?.toLowerCase() ??
		// 		this.allCards.getCard(cards[i].mercenaryCardId)?.rarity?.toLowerCase() ??
		// 		'free';
		// 	statEvent['card' + (i + 1) + 'CurrencyAmount'] = cards[i].currencyAmount;
		// 	statEvent['card' + (i + 1) + 'MercenaryCardId'] = cards[i].mercenaryCardId;
		// 	statEvent['card' + (i + 1) + 'IsNew'] = cards[i].isNew;
		// 	statEvent['card' + (i + 1) + 'IsSecondCopy'] = cards[i].isSecondCopy;
		// }
		console.debug('[pack-stats] publishing pack stat', statEvent);
		this.api.callPostApi(PACKS_UPDATE_URL, statEvent);
		this.updateLocalPackStats(boosterId, setId, cards);
	}

	private async updateLocalPackStats(boosterId: BoosterType, setId: string, cards: readonly InternalCardInfo[]) {
		const localPackResult = await this.diskCache.getItem<LocalPackStats>(
			DiskCacheService.DISK_CACHE_KEYS.COLLECTION_PACK_STATS,
		);
		if (!localPackResult) {
			console.debug('Empty local packs, not updating local pack history');
			return;
		}

		const newPack: PackResult = {
			id: 0,
			boosterId: boosterId,
			creationDate: Date.now(),
			setId: setId,
			cards: this.buildCards(cards),
			cardsJson: cards,
		};
		const newPackResults: LocalPackStats = {
			...localPackResult,
			lastUpdateDate: new Date(localPackResult.lastUpdateDate),
			packs: [...localPackResult.packs, newPack],
		};
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.COLLECTION_PACK_STATS, newPackResults);
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
