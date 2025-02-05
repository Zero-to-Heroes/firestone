import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { DiskCacheService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map, skip } from 'rxjs';
import { CARDS_VERSION } from './hs-utils';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(
		private readonly cards: AllCardsService,
		private readonly prefs: PreferencesService,
		private readonly diskCache: DiskCacheService,
	) {}

	public async init() {
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
		await this.prefs.isReady();
		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.locale),
				distinctUntilChanged(),
				skip(1), // Initial load is done in orchestrator
			)
			.subscribe((locale) => {
				this.initCards(locale);
			});
	}

	private async initCards(locale: string) {
		const fileName = this.getFileName(locale);
		console.log('[cards-init] initializing cards db with', fileName);
		const localCards: readonly ReferenceCard[] | null = await this.retrieveLocalCards(fileName);
		if (!!localCards?.length) {
			this.cards.initializeCardsDbFromCards(localCards);
			console.log('[cards-init] initialized cards with local cache', localCards?.length);
		}
		// Make this non-blocking, so the app can already start with the cached info, while we get the
		// updated cards in the background
		setTimeout(async () => {
			await this.cards.initializeCardsDb(CARDS_VERSION, fileName);
			console.log('[cards-init] loaded cards from remote', this.cards.getCards().length);
			await this.saveCardsLocally(fileName, this.cards.getCards());
		});
	}

	private getFileName(locale: string) {
		return `cards_${locale}.gz.json`;
	}

	private async saveCardsLocally(fileName: string, cards: readonly ReferenceCard[]) {
		await this.diskCache.storeItem(fileName, cards);
	}

	private async retrieveLocalCards(fileName: string): Promise<readonly ReferenceCard[] | null> {
		const localCards = await this.diskCache.getItem<readonly ReferenceCard[]>(fileName);
		return localCards;
	}
}
