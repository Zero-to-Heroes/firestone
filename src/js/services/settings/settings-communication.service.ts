import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsCommunicationService {
	private settingsEventBus = new BehaviorSubject<[string, string]>(['general', null]);

	constructor() {
		window['settingsEventBus'] = this.settingsEventBus;
	}
}
