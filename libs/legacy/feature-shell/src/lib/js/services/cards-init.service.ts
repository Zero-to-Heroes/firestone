import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { CARDS_VERSION } from './hs-utils';
import { PreferencesService } from './preferences.service';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(
		private readonly cards: AllCardsService,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {}

	public async init() {
		console.debug('starting init');
		if (this.inInit) {
			console.warn('already in init');
			return;
		}

		this.inInit = true;
		const prefs = await this.prefs.getPreferences();
		await this.initCards(prefs.locale);
		window['cards'] = this.cards;
		this.startListeningToChanges();
	}

	private async startListeningToChanges() {
		await this.store.initComplete();
		this.store.listenPrefs$((prefs) => prefs.locale).subscribe(async ([locale]) => this.initCards(locale));
	}

	private async initCards(locale: string) {
		const fileName = this.getFileName(locale);
		console.log('initializing cards db with', fileName);
		await this.cards.initializeCardsDb(CARDS_VERSION, fileName, false);
	}

	private getFileName(locale: string) {
		return `cards_${locale}.gz.json`;
	}
}
