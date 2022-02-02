import { Injectable } from '@angular/core';
import { TwitchPreferences } from '@components/decktracker/overlay/twitch/twitch-preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class TwitchPreferencesService {
	public prefs = new BehaviorSubject<TwitchPreferences>(new TwitchPreferences());

	constructor() {
		this.init();
	}

	public async init(): Promise<void> {
		const prefsStr = localStorage.getItem('firestone-twitch-preferences');
		const prefs = prefsStr ? JSON.parse(prefsStr) : new TwitchPreferences();
		this.prefs.next(prefs);
	}

	public async savePrefs(value: TwitchPreferences): Promise<void> {
		localStorage.setItem('firestone-twitch-preferences', JSON.stringify(value));
		this.prefs.next(value);
	}
}
