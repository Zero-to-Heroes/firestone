import { Injectable } from '@angular/core';
import { MemoryUpdate, MemoryUpdatesService } from '@firestone/memory';
import { BehaviorSubject } from 'rxjs';
import { concatMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { GameNativeState } from './game-native-state';

@Injectable()
export class GameNativeStateStoreService {
	public store$ = new BehaviorSubject<GameNativeState>(GameNativeState.create({}));

	constructor(private readonly memoryUpdates: MemoryUpdatesService) {
		this.init();
		window['gameNativeStateStore'] = this.store$;
	}

	private async processChanges(changes: MemoryUpdate): Promise<void> {
		try {
			if (changes.isFriendsListOpen != null) {
				this.store$.next(
					this.store$.value.update({
						isFriendsListOpen: changes.isFriendsListOpen,
					}),
				);
			}
		} catch (e) {
			console.error('[game-native-state] could not process event', e);
		}
	}

	private async init() {
		this.memoryUpdates.memoryUpdates$$
			.pipe(
				distinctUntilChanged(),
				filter((changes) => !!changes),
				concatMap(async (changes) => await this.processChanges(changes)),
			)
			.subscribe();
	}
}
