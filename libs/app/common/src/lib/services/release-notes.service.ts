import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { firstValueFrom } from 'rxjs';
import {
	getReleaseNotesAssetPath,
	getReleaseNotesGithubUrl,
	replaceReleaseNotesCardPlaceholders,
} from './release-notes.utils';

@Injectable({ providedIn: 'root' })
export class ReleaseNotesService {
	private readonly localizedReleaseNotesCache = new Map<string, boolean>();

	constructor(
		private readonly http: HttpClient,
		private readonly cardsFacade: CardsFacadeService,
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

	public processCardPlaceholders(markdown: string): string {
		return replaceReleaseNotesCardPlaceholders(markdown, (cardId) => {
			const card = this.cardsFacade.getCard(cardId, false);
			if (!card) {
				return undefined;
			}
			return { name: card.name, rarity: card.rarity };
		});
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
