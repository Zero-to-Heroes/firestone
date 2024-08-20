import { EventEmitter, Injectable } from '@angular/core';
import { GameEvent } from '../models/game-event';

@Injectable()
export class GameEventsFacadeService {
	public allEvents = new EventEmitter<GameEvent>();
}
