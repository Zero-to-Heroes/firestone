import { EventEmitter, Injectable } from '@angular/core';
import { GameEvent } from '../models/game-event';

@Injectable()
export class GameEventsEmitterService {
	public allEvents = new EventEmitter<GameEvent>();
	public newLogLineEvents = new EventEmitter<GameEvent>();
	public onGameStart = new EventEmitter<GameEvent>();
}
