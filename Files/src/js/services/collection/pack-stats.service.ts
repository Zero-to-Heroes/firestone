import { Injectable } from '@angular/core';

import { captureEvent } from '@sentry/core';
import { Events } from '../events.service';
import { AllCardsService } from '../all-cards.service';
import { Card } from '../../models/card';
import { HttpClient } from '@angular/common/http';
import { OverwolfService } from '../overwolf.service';

@Injectable()
export class PackStatsService {
	private readonly PACK_STAT_URL: string = 'https://2xwty3krsl.execute-api.us-west-2.amazonaws.com/Prod/packstats';
	private readonly CARD_STAT_URL: string = 'https://ke4xvpzrfi.execute-api.us-west-2.amazonaws.com/Prod/cardstats';

	private userId: string;
	private userMachineId: string;
	private username: string;

	constructor(private events: Events, private allCards: AllCardsService, private ow: OverwolfService, private http: HttpClient) {
		this.events.on(Events.NEW_PACK).subscribe(event => this.publishPackStat(event));
		this.events.on(Events.NEW_CARD).subscribe(event => this.publishCardStat(event.data[0], event.data[1], true));
		this.events.on(Events.MORE_DUST).subscribe(event => this.publishCardStat(event.data[0], event.data[2], false));
		this.retrieveUserInfo();
	}

	private async retrieveUserInfo() {
		const user = await this.ow.getCurrentUser();
		console.log('retrieved user', user);
		this.userId = user.userId;
		this.userMachineId = user.machineId;
		this.username = user.username;
	}

	private publishPackStat(event: any): any {
		const setId = event.data[0];
		const cards: any[] = event.data[1];
		const statEvent = {
			'creationDate': new Date(),
			'userId': this.userId,
			'userMachineId': this.userMachineId,
			'userName': this.username,
			'setId': setId,
		};
		for (let i = 0; i < cards.length; i++) {
			statEvent['card' + (i + 1) + 'Id'] = cards[i].cardId.toLowerCase();
			statEvent['card' + (i + 1) + 'Type'] = cards[i].cardType.toLowerCase();
			statEvent['card' + (i + 1) + 'Rarity'] = this.allCards.getCard(cards[i].cardId).rarity.toLowerCase();
		}
		console.log('posting pack stat event', statEvent);
		this.http.post(this.PACK_STAT_URL, statEvent).subscribe(
			result => console.log('pack stat event result', result),
			error => {
				console.error('Could not send pack stats info', error);
				captureEvent({
					message: 'Could not send pack stats info',
					extra: {
						error: error,
						statEvent: statEvent,
					},
				});
			},
		);
	}

	private publishCardStat(card: Card, type: string, isNew: boolean) {
		console.log('ready to publish card stat event', card, type, isNew);
		const statEvent = {
			'creationDate': new Date(),
			'userId': this.userId,
			'userMachineId': this.userMachineId,
			'userName': this.username,
			'cardId': card.id,
			'type': type.toLowerCase(),
			'rarity': this.allCards.getCard(card.id).rarity.toLowerCase(),
			'isNew': isNew,
		};
		console.log('posting card stat event', statEvent);
		this.http.post(this.CARD_STAT_URL, statEvent).subscribe(
			result => console.log('card stat event result', result),
			error => {
				console.error('Could not send card stats info', error);
				captureEvent({
					message: 'Could not send card stats info',
					extra: {
						error: error,
						statEvent: statEvent,
					},
				});
			},
		);
	}
}
