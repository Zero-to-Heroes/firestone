import { Injectable } from '@angular/core';
import { BoosterType, CardIds } from '@firestone-hs/reference-data';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { InternalCardInfo } from '../../models/collection/internal-card-info';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { LocalStorageService } from '../local-storage';
import { CollectionPacksUpdatedEvent } from '../mainwindow/store/events/collection/colection-packs-updated-event';
import { OverwolfService } from '../overwolf.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { SetsService } from './sets-service.service';

const PACKS_UPDATE_URL = 'https://api.firestoneapp.com/packs/save/packs/{proxy+}';
const PACKS_RETRIEVE_URL = 'https://api.firestoneapp.com/packs/get/packs/{proxy+}';

@Injectable()
export class PackStatsService {
	constructor(
		private readonly events: Events,
		private readonly allCards: SetsService,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.events.on(Events.NEW_PACK).subscribe((event) => this.publishPackStat(event));
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		// Ideally this would be fully reactive, but there are too many processes that depend on it,
		// so for now I will just use a local cache
		const localPackResult = this.localStorage.getItem<LocalPackStats>('collection-pack-stats');
		console.debug('[pack] localPackResult', localPackResult);
		// Cache the local results for 7 days
		if (
			localPackResult &&
			Date.now() - new Date(localPackResult.lastUpdateDate).getTime() <= 7 * 24 * 60 * 60 * 1000
		) {
			return localPackResult.packs;
		}

		const user = await this.ow.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
		};
		const data: any = (await this.api.callPostApi<any>(PACKS_RETRIEVE_URL, input)) ?? [];
		console.debug('[pack] data', data);
		const packs: readonly PackResult[] =
			data.results
				// Because of how pack logging used to work, when you received the 5 galakrond cards,
				// the app flagged that as a new pack
				?.filter((pack) => !this.isPackAllGalakronds(pack)) ?? [];
		console.debug('[pack] packs', packs);
		const newPackResults: LocalPackStats = {
			lastUpdateDate: new Date(),
			packs: packs,
		};
		this.localStorage.setItem('collection-pack-stats', newPackResults);
		console.debug('[pack] newPackResults', newPackResults);
		return newPackResults.packs;
	}

	public async refreshPackStats() {
		const user = await this.ow.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
		};
		const data: any = (await this.api.callPostApi<any>(PACKS_RETRIEVE_URL, input)) ?? [];
		const packs: readonly PackResult[] =
			data.results
				// Because of how pack logging used to work, when you received the 5 galakrond cards,
				// the app flagged that as a new pack
				?.filter((pack) => !this.isPackAllGalakronds(pack)) ?? [];
		const newPackResults: LocalPackStats = {
			lastUpdateDate: new Date(),
			packs: packs,
		};
		this.localStorage.setItem('collection-pack-stats', newPackResults);
		this.store.send(new CollectionPacksUpdatedEvent(newPackResults.packs));
	}

	private async publishPackStat(event: any) {
		const setId = event.data[0];
		const cards: readonly InternalCardInfo[] = event.data[1];
		const boosterId: BoosterType = event.data[2];
		const user = await this.ow.getCurrentUser();
		const statEvent = {
			creationDate: new Date(),
			setId: setId,
			boosterId: boosterId,
			userId: user.userId,
			userName: user.username,
		};
		for (let i = 0; i < cards.length; i++) {
			statEvent['card' + (i + 1) + 'Id'] = cards[i].cardId?.toLowerCase();
			statEvent['card' + (i + 1) + 'Type'] = cards[i].cardType?.toLowerCase();
			const dbCard = this.allCards.getCard(cards[i].cardId);
			statEvent['card' + (i + 1) + 'Rarity'] =
				dbCard?.rarity?.toLowerCase() ??
				this.allCards.getCard(cards[i].mercenaryCardId)?.rarity?.toLowerCase() ??
				'free';
			statEvent['card' + (i + 1) + 'CurrencyAmount'] = cards[i].currencyAmount;
			statEvent['card' + (i + 1) + 'MercenaryCardId'] = cards[i].mercenaryCardId;
		}
		this.api.callPostApi(PACKS_UPDATE_URL, statEvent);
		this.updateLocalPackStats(boosterId, setId, cards);
	}

	private updateLocalPackStats(boosterId: BoosterType, setId: string, cards: readonly InternalCardInfo[]) {
		const localPackResult = this.localStorage.getItem<LocalPackStats>('collection-pack-stats');
		console.debug('[pack] localPackResult', localPackResult);
		if (!localPackResult) {
			console.error('Empty local packs');
			return;
		}

		const newPack: PackResult = {
			id: 0,
			boosterId: boosterId as any,
			creationDate: Date.now(),
			setId: setId,
			cards: cards.map((card) => {
				const result: CardPackResult = {
					cardId: card.cardId,
					cardRarity: (this.allCards.getCard(card.cardId).rarity?.toLowerCase() ??
						this.allCards.getCard(card.mercenaryCardId)?.rarity?.toLowerCase()) as
						| 'common'
						| 'rare'
						| 'epic'
						| 'legendary',
					cardType: card.cardType as 'NORMAL' | 'GOLDEN',
					currencyAmount: card.currencyAmount,
					mercenaryCardId: card.mercenaryCardId,
				};
				return result;
			}),
		};
		const newPackResults: LocalPackStats = {
			...localPackResult,
			lastUpdateDate: new Date(localPackResult.lastUpdateDate),
			packs: [...localPackResult.packs, newPack],
		};
		console.debug('[pack] will update local packs', newPack, newPackResults);
		this.localStorage.setItem('collection-pack-stats', newPackResults);
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
