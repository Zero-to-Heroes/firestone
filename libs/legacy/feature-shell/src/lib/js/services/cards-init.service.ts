import { Injectable } from '@angular/core';
import { AllCardsService, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { DiskCacheService, GlobalErrorService, PreferencesService } from '@firestone/shared/common/service';
import { distinctUntilChanged, map, skip } from 'rxjs';
import { CARDS_VERSION, isPreReleaseBuild } from './hs-utils';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(
		private readonly cards: AllCardsService,
		private readonly prefs: PreferencesService,
		private readonly diskCache: DiskCacheService,
		private readonly globalErrorService: GlobalErrorService,
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
		if (!isPreReleaseBuild && !!localCards?.length && localCards.length % 8000 !== 0) {
			this.cards.initializeCardsDbFromCards(localCards);
			console.log('[cards-init] initialized cards with local cache', localCards?.length);
			// Make this non-blocking, so the app can already start with the cached info, while we get the
			// updated cards in the background
			setTimeout(async () => {
				await this.loadCardsFromRemote(fileName, false);
			});
		} else {
			await this.loadCardsFromRemote(fileName);
		}
	}

	private async loadCardsFromRemote(fileName: string, throwException = true) {
		try {
			await this.cards.initializeCardsDb(CARDS_VERSION, fileName);
			console.log('[cards-init] loaded cards from remote', this.cards.getCards()?.length);
			console.debug(
				'[cards-init] loaded cards from remote',
				this.cards.getCards()?.find((c) => c.id === CardIds.SoulJuggler_BGS_002),
			);
			// An exact count means that we are missing the last split
			if (!this.cards.getCards()?.length || this.cards.getCards().length % 8000 === 0) {
				console.error('[cards-init] could not load cards');
				// this.globalErrorService.notifyCriticalError('no-cards');
				if (throwException) {
					throw new Error(`Could not load cards ${CARDS_VERSION}, ${fileName}`);
				}
			} else {
				await this.saveCardsLocally(fileName, this.cards.getCards());
			}
		} catch (e) {
			console.error('[cards-init] could not load cards', e);
			this.globalErrorService.notifyCriticalError('no-cards');
			// Don't throw, otherwise we won't be able to display the notification
			// throw e;
		}
	}

	private getFileName(locale: string) {
		const preReleaseSuffix = isPreReleaseBuild ? '_pre_release' : '';
		return `cards_${locale}${preReleaseSuffix}.gz.json`;
	}

	private async saveCardsLocally(fileName: string, cards: readonly ReferenceCard[]) {
		await this.diskCache.storeItem(fileName, cards);
	}

	private async retrieveLocalCards(fileName: string): Promise<readonly ReferenceCard[] | null> {
		const localCards = await this.diskCache.getItem<readonly ReferenceCard[]>(fileName);
		return localCards;
	}
}
