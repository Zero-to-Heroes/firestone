import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BoosterType } from '@firestone-hs/reference-data';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { SetsService } from './sets-service.service';

@Injectable()
export class PackStatsService {
	private readonly PACK_STAT_URL: string = 'https://2xwty3krsl.execute-api.us-west-2.amazonaws.com/Prod/packstats';
	// private readonly CARD_STAT_URL: string = 'https://ke4xvpzrfi.execute-api.us-west-2.amazonaws.com/Prod/cardstats';

	private userId: string;
	private userMachineId: string;
	private username: string;

	constructor(
		private events: Events,
		private allCards: SetsService,
		private ow: OverwolfService,
		private http: HttpClient,
	) {
		this.events.on(Events.NEW_PACK).subscribe(event => this.publishPackStat(event));
		// this.events.on(Events.NEW_CARD).subscribe(event => this.publishCardStat(event.data[0], event.data[1], true));
		// this.events.on(Events.MORE_DUST).subscribe(event => this.publishCardStat(event.data[0], event.data[2], false));
		this.retrieveUserInfo();
	}

	private async retrieveUserInfo() {
		const user = await this.ow.getCurrentUser();
		console.log('retrieved user', user);
		this.userId = user.userId;
		this.userMachineId = user.machineId;
		this.username = user.username;
	}

	private async publishPackStat(event: any) {
		const setId = event.data[0];
		const cards: any[] = event.data[1];
		const boosterId: BoosterType = event.data[2];
		await this.retrieveUserInfo();
		const statEvent = {
			creationDate: new Date(),
			userId: this.userId,
			userName: this.username,
			setId: setId,
			boosterId: boosterId,
		};
		for (let i = 0; i < cards.length; i++) {
			statEvent['card' + (i + 1) + 'Id'] = cards[i].cardId.toLowerCase();
			statEvent['card' + (i + 1) + 'Type'] = cards[i].cardType.toLowerCase();
			const dbCard = this.allCards.getCard(cards[i].cardId);
			statEvent['card' + (i + 1) + 'Rarity'] = dbCard && dbCard.rarity ? dbCard.rarity?.toLowerCase() : 'free';
		}
		console.log('posting pack stat event', statEvent);
		this.publishPackStatInternal(statEvent);
	}

	private publishPackStatInternal(statEvent, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			console.error('Could not send pack stats info');
			return;
		}
		this.http.post(this.PACK_STAT_URL, statEvent).subscribe(
			result => console.log('pack stat event result', result),
			error => {
				console.warn('Could not send pack stats info', error);
				setTimeout(() => this.publishPackStatInternal(statEvent, retriesLeft - 1));
			},
		);
	}
}
