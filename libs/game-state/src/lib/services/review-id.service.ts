import { Injectable } from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import { BehaviorSubject } from 'rxjs';
import { GameEventsEmitterService } from './game-events/game-events-emitter.service';
import { IReviewIdService } from './review-id.interface';

@Injectable()
export class ReviewIdService implements IReviewIdService {
	public reviewId$$ = new BehaviorSubject<string | null>(null);

	constructor(private readonly gameEvents: GameEventsEmitterService) {
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
