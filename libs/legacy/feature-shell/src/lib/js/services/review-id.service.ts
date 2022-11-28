import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { Events } from './events.service';
import { ManastormInfo } from './manastorm-bridge/manastorm-info';

@Injectable()
export class ReviewIdService {
	public reviewId$ = new BehaviorSubject<string>(null);

	constructor(private readonly events: Events) {
		this.events
			.on(Events.REVIEW_INITIALIZED)
			.pipe(
				map((event) => event.data[0] as ManastormInfo),
				filter((info) => !!info.reviewId),
				map((info) => info.reviewId),
				startWith(null),
				distinctUntilChanged(),
				tap((info) => console.debug('[duels-loot] reviewId', info)),
			)
			.subscribe(this.reviewId$);
	}
}
