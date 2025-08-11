import { EventEmitter, Injectable } from '@angular/core';
import { GameEvent } from './game-events/game-event';

@Injectable()
export class GameEventsFacadeService {
	public allEvents = new EventEmitter<GameEvent>();
}
