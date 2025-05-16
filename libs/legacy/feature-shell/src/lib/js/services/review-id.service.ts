import { Injectable } from '@angular/core';
import { IReviewIdService } from '@firestone/game-state';
import { uuid } from '@firestone/shared/framework/common';
import { BehaviorSubject } from 'rxjs';
import { Events } from './events.service';
import { GameEventsEmitterService } from './game-events-emitter.service';

@Injectable()
export class ReviewIdService implements IReviewIdService {
	public reviewId$$ = new BehaviorSubject<string>(null);

	constructor(private readonly events: Events, private readonly gameEvents: GameEventsEmitterService) {
		this.init();
	}

	private init() {
		// TODO: merge both subscriptions into one
		this.gameEvents.onGameStart.subscribe((event) => {
			console.log('[game-state] game start event received, resetting currentReviewId');
			this.reviewId$$.next(uuid());
		});
	}
}
