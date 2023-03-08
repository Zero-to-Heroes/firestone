import { Injectable } from '@angular/core';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { WebsitePreferences } from './website-preferences';

@Injectable()
export class WebsitePreferencesService {
	public preferences$$ = new BehaviorSubject<WebsitePreferences>(new WebsitePreferences());

	constructor(private readonly localStorageService: LocalStorageService) {}

	public async savePreferences(preferences: WebsitePreferences): Promise<WebsitePreferences> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES, preferences);
		return preferences;
	}

	public async getPreferences(): Promise<WebsitePreferences> {
		const strPrefs = localStorage.getItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES);
		const result = !!strPrefs
			? Object.assign(new WebsitePreferences(), JSON.parse(strPrefs))
			: new WebsitePreferences();
		return result;
	}
}
