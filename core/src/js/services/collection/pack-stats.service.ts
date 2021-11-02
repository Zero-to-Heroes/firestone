import { Injectable } from '@angular/core';
import { BoosterType, CardIds } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { InternalCardInfo } from '../../models/collection/internal-card-info';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
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
	) {
		this.events.on(Events.NEW_PACK).subscribe((event) => this.publishPackStat(event));
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		const user = await this.ow.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
		};
		const data: any = (await this.api.callPostApi<any>(PACKS_RETRIEVE_URL, input)) ?? [];
		// console.debug('received full pack stats', data);
		return (
			data.results
				// Because of how pack logging used to work, when you received the 5 galakrond cards,
				// the app flagged that as a new pack
				?.filter((pack) => !this.isPackAllGalakronds(pack)) ?? []
		);
	}

	private async publishPackStat(event: any) {
		const setId = event.data[0];
		const cards: readonly InternalCardInfo[] = event.data[1];
		const boosterId: BoosterType = event.data[2];
		const user = await this.ow.getCurrentUser();
		const statEvent = {
			creationDate: new Date(),
			userId: user.userId,
			userName: user.username,
			setId: setId,
			boosterId: boosterId,
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
