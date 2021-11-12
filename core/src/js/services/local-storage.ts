import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';

@Injectable()
export class LocalStorageService {
	public static LOCAL_STORAGE_USER_PREFERENCES = 'user-preferences';
	public static LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS = 'in-game-achievements';
	public static LOCAL_STORAGE_ACHIEVEMENTS_HISTORY = 'achievements-history';
	public static LOCAL_STORAGE_COLLECTION = 'collection';
	public static LOCAL_STORAGE_CARD_BACKS = 'card-backs';
	public static LOCAL_STORAGE_PACK_INFOS = 'pack-infos';
	public static LOCAL_STORAGE_COINS = 'coins';
	public static LOCAL_STORAGE_CARDS_HISTORY = 'cards-history';
	public static LOCAL_STORAGE_MERCENARIES_COLLECTION = 'mercenariesMemoryCollectionInfo';

	private internalSubject = new BehaviorSubject<{ key: string; value: any }>(null);
	private cache = {};

	constructor() {
		this.internalSubject
			.asObservable()
			.pipe(
				// tap((info) => console.debug('local info', info)),
				debounceTime(2000),
				tap((info) => console.debug('after debounce', info)),
				filter((info) => !!info),
				tap((info) => console.debug('after filter', info)),
				// groupBy(
				// 	(x) => x.key,
				// 	(x) => x.value,
				// ),
				// tap((info) => console.debug('after groupby', info)),
				// mergeMap((group) => zip(of(group.key), group.pipe(toArray()))),
				// tap((info) => console.debug('after mergemap', info)),
			)
			.subscribe((info) => {
				console.debug('local storage info', info);
				// const latestValue = info[info.length - 1].
				// localStorage.setItem(key, JSON.stringify(value));
			});
	}

	public setItem(key: string, value: any): void {
		console.debug('set item', key, value);
		this.cache[key] = value;
		this.internalSubject.next({ key, value });
		localStorage.setItem(key, JSON.stringify(value));
	}

	public getItem(key: string): any {
		return this.cache[key] ?? JSON.parse(localStorage.getItem(key));
	}
}
