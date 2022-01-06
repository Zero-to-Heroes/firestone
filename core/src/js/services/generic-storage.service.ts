import { Injectable } from '@angular/core';
import { Preferences } from '../models/preferences';
import { LocalStorageService } from './local-storage';

declare let amplitude;

@Injectable()
export class GenericStorageService {
	constructor(private readonly localStorageService: LocalStorageService) {}

	public async saveUserPreferences(preferences: Preferences): Promise<Preferences> {
		// console.debug('saving user prefs', preferences, preferences?.opponentOverlayPosition, new Error().stack);
		// if (!preferences?.opponentOverlayPosition) {
		// 	console.warn('no-format', 'pref missing overlay position', preferences, new Error().stack);
		// }
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES, preferences);
		return preferences;
	}

	public async getUserPreferences(): Promise<Preferences> {
		const strPrefs = localStorage.getItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES);
		const result = !!strPrefs ? Object.assign(new Preferences(), JSON.parse(strPrefs)) : new Preferences();
		const resultWithDate: Preferences = {
			...result,
			lastUpdateDate: result.lastUpdateDate ? new Date(result.lastUpdateDate) : null,
		};
		return resultWithDate;
	}
}
