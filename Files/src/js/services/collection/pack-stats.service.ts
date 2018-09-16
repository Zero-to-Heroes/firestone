import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { PackHistory } from '../../models/pack-history';
import { AllCardsService } from '../all-cards.service';
import { Http } from '@angular/http';

declare var overwolf: any;

@Injectable()
export class PackStatsService {

    private readonly PACK_STAT_URL: string = 'https://2xwty3krsl.execute-api.us-west-2.amazonaws.com/Prod/packstats';

    private userId: string;
    private userMachineId: string;

	constructor(private events: Events, private allCards: AllCardsService, private http: Http) {
        this.events.on(Events.NEW_PACK).subscribe(event => this.publishPackStat(event));
        this.retrieveUserInfo();
    }

    private retrieveUserInfo() {
        overwolf.profile.getCurrentUser((user) => {
            this.userId = user.userId;
            this.userMachineId = user.machineId;
        });
    }
    
    private publishPackStat(event: any): any {
        const setId = event.data[0];
        const cards: any[] = event.data[1];
        const statEvent = {
            "creationDate": new Date(),
            "userId": this.userId,
            "userMachineId": this.userMachineId,
            "setId": setId
        };
        for (let i = 0; i < cards.length; i++) {
            statEvent['card' + (i + 1) + 'Id'] = cards[i].cardId.toLowerCase();
            statEvent['card' + (i + 1) + 'Type'] = cards[i].cardType.toLowerCase();
            statEvent['card' + (i + 1) + 'Rarity'] = this.allCards.getCard(cards[i].cardId).rarity.toLowerCase();
        }
        console.log('posting stat event', statEvent);
        this.http.post(this.PACK_STAT_URL, statEvent)
                .subscribe((stuff) => console.log('did stuff', stuff));
    }
}
