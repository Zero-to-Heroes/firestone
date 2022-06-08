import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { CARDS_VERSION } from './hs-utils';
import { PreferencesService } from './preferences.service';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(private readonly cards: AllCardsService, private readonly prefs: PreferencesService) {}

	public async init() {
		console.debug('starting init');
		if (this.inInit) {
			console.warn('already in init');
			return;
		}

		this.inInit = true;
		const prefs = await this.prefs.getPreferences();
		const fileName = this.getFileName(prefs.locale);
		console.log('initializing cards db with', fileName);
		await this.cards.initializeCardsDb(CARDS_VERSION, fileName, false);
		window['cards'] = this.cards;
	}

	private getFileName(locale: string) {
		return `cards_${locale}.gz.json`;
	}
}
