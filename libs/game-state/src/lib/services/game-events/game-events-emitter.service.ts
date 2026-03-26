import { EventEmitter, Injectable } from '@angular/core';
import { PtlGameStateUpdate } from '@firestone/power-log-parser';
import { Subject } from 'rxjs';
import { GameEvent } from './game-event';

@Injectable()
export class GameEventsEmitterService {
	public allEvents = new EventEmitter<GameEvent>();
	public newLogLineEvents = new EventEmitter<GameEvent>();
	public onGameStart = new EventEmitter<GameEvent>();
	public ptlGameState$ = new Subject<PtlGameStateUpdate>();
}
