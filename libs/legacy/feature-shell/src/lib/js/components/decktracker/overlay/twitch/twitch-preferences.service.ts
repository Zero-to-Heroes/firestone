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
		let prefsStr: string = null;
		try {
			prefsStr = localStorage.getItem('firestone-twitch-preferences');
		} catch (e) {
			console.warn('could not load prefs', e);
		}
		const prefs = prefsStr ? Object.assign(new TwitchPreferences(), JSON.parse(prefsStr)) : new TwitchPreferences();
		this.prefs.next(prefs);
	}

	public async savePrefs(value: TwitchPreferences): Promise<void> {
		try {
			localStorage.setItem('firestone-twitch-preferences', JSON.stringify(value));
		} catch (e) {
			console.warn('could not save prefs', e);
		}
		this.prefs.next(value);
	}
}
