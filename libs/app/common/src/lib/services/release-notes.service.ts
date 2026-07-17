import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { CARDS_VERSION, isPreReleaseBuild } from '@firestone/game-state';
import { DiskCacheService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { firstValueFrom } from 'rxjs';
import {
	getReleaseNotesAssetPath,
	getReleaseNotesGithubUrl,
	ReleaseNotesCardInfo,
	replaceReleaseNotesCardPlaceholders,
} from './release-notes.utils';

@Injectable({ providedIn: 'root' })
export class ReleaseNotesService {
	private readonly localizedReleaseNotesCache = new Map<string, boolean>();
	private readonly cardLookupByLocale = new Map<string, Map<string, ReleaseNotesCardInfo>>();

	constructor(
		private readonly http: HttpClient,
		private readonly cardsFacade: CardsFacadeService,
		private readonly diskCache: DiskCacheService,
	) {}

	public async hasLocalizedReleaseNotes(version: string, locale: string): Promise<boolean> {
		if (!locale || locale === 'enUS') {
			return false;
		}

		const cacheKey = `${locale}/${version}`;
		if (this.localizedReleaseNotesCache.has(cacheKey)) {
			return this.localizedReleaseNotesCache.get(cacheKey)!;
		}

		const localized = await this.tryLoadReleaseNotes(getReleaseNotesAssetPath(version, locale));
		const hasLocalized = localized !== undefined;
		this.localizedReleaseNotesCache.set(cacheKey, hasLocalized);
		return hasLocalized;
	}

	public async loadReleaseNotes(version: string, locale: string): Promise<string | undefined> {
		if (locale && locale !== 'enUS') {
			const localized = await this.tryLoadReleaseNotes(getReleaseNotesAssetPath(version, locale));
			if (localized !== undefined) {
				return localized;
			}
		}
		return this.tryLoadReleaseNotes(getReleaseNotesAssetPath(version, 'enUS'));
	}

	public async processCardPlaceholders(
		markdown: string,
		displayLocale: string,
		appLocale: string,
	): Promise<string> {
		const getCard = await this.getCardResolver(displayLocale, appLocale);
		return replaceReleaseNotesCardPlaceholders(markdown, getCard);
	}

	private async getCardResolver(
		displayLocale: string,
		appLocale: string,
	): Promise<(cardId: string) => ReleaseNotesCardInfo | undefined> {
		if (displayLocale === appLocale) {
			return (cardId) => {
				const card = this.cardsFacade.getCard(cardId, false);
				if (!card?.name) {
					return undefined;
				}
				return { name: card.name, rarity: card.rarity };
			};
		}

		const lookup = await this.getCardLookupForLocale(displayLocale);
		return (cardId) => lookup.get(cardId);
	}

	private async getCardLookupForLocale(locale: string): Promise<Map<string, ReleaseNotesCardInfo>> {
		const cached = this.cardLookupByLocale.get(locale);
		if (cached) {
			return cached;
		}

		const lookup = await this.loadCardLookupForLocale(locale);
		this.cardLookupByLocale.set(locale, lookup);
		return lookup;
	}

	private getCardsFileName(locale: string): string {
		const preReleaseSuffix = isPreReleaseBuild ? '_pre_release' : '';
		return `cards_${locale}${preReleaseSuffix}.gz.json`;
	}

	private async loadCardLookupForLocale(locale: string): Promise<Map<string, ReleaseNotesCardInfo>> {
		const lookup = new Map<string, ReleaseNotesCardInfo>();
		const fileName = this.getCardsFileName(locale);
		const localCards = await this.diskCache.getItem<readonly ReferenceCard[]>(fileName);
		if (localCards?.length && localCards.length % 8000 !== 0) {
			this.addCardsToLookup(lookup, localCards);
			return lookup;
		}

		const allCards = new AllCardsService();
		await allCards.initializeCardsDb(CARDS_VERSION, fileName);
		this.addCardsToLookup(lookup, allCards.getCards());
		return lookup;
	}

	private addCardsToLookup(
		lookup: Map<string, ReleaseNotesCardInfo>,
		cards: readonly ReferenceCard[],
	): void {
		for (const card of cards) {
			if (card.id && card.name) {
				lookup.set(card.id, { name: card.name, rarity: card.rarity });
			}
		}
	}

	public getReleaseNotesUrl(version: string, locale: string): string {
		return getReleaseNotesGithubUrl(version, locale);
	}

	private async tryLoadReleaseNotes(path: string): Promise<string | undefined> {
		try {
			return await firstValueFrom(this.http.get(path, { responseType: 'text' }));
		} catch (error) {
			if (error instanceof HttpErrorResponse && error.status === 404) {
				return undefined;
			}
			throw error;
		}
	}
}
