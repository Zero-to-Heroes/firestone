import { Injectable } from '@angular/core';
import { PlayerInfo } from '../models/player-info';
import { Events } from './events.service';

@Injectable()
export class PlayersInfoService {
	public playerInfo: PlayerInfo;
	public opponentInfo: PlayerInfo;

	constructor(private events: Events) {
		this.events.on(Events.PLAYER_INFO).subscribe(event => {
			this.playerInfo = event.data[0];
		});
		this.events.on(Events.OPPONENT_INFO).subscribe(event => {
			this.opponentInfo = event.data[0];
		});
	}
}
