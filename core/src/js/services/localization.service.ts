import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { CardsFacadeService } from './cards-facade.service';
import { formatClass } from './hs-utils';
import { OverwolfService } from './overwolf.service';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';
import { capitalizeEachWord } from './utils';

@Injectable()
export class LocalizationService {
	private locale = 'enUS';
	private useHighResImages: boolean;

	private translate: TranslateService;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
	) {}

	public async start() {
		await this.store.initComplete();
		this.translate = this.ow.getMainWindow().translateService;
		this.store
			.listen$(([main, nav, prefs]) => prefs.locale)
			.pipe(map(([pref]) => pref))
			.subscribe((pref) => {
				this.locale = pref;
			});
		this.store
			.listen$(([main, nav, prefs]) => prefs.collectionUseHighResImages)
			.pipe(map(([pref]) => pref))
			.subscribe((pref) => {
				this.useHighResImages = pref;
			});
		window['localizationService'] = this;
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		if (!cardId) {
			return null;
		}
		const bgs = options?.isBgs ? 'bgs/' : '';
		const heroSkin = options?.isHeroSkin ? 'heroSkins/' : '';
		const highRes = this.useHighResImages || options?.isHighRes ? '512' : '256';
		const base = `https://static.firestoneapp.com/cards/${bgs}${heroSkin}${this.locale}/${highRes}`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}?v=2`;
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}?v=2`;
	}

	// Because each localization has its own file, we always get the info from the root
	public getCardName(cardId: string, defaultName: string = null): string {
		const card = this.allCards.getCard(cardId);
		// const loc = card.locales?.find((locale) => locale?.locale === this.locale);
		return card?.name ?? defaultName;
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return `Created by ${this.getCardName(creatorCardId) ?? 'unknown'}`;
	}

	public getUnknownCardName(playerClass: string = null): string {
		return playerClass ? `Unknown ${formatClass(playerClass)} card` : 'Unknown Card';
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return `Unknown ${manaCost} mana spell`;
	}

	public getUnknownRaceName(race: string): string {
		return `Unknown ${capitalizeEachWord(race)}`;
	}

	public translateString(key: string): string {
		return this.translate.instant(key);
	}
}

export interface ImageLocalizationOptions {
	readonly isBgs?: boolean;
	readonly isPremium?: boolean;
	readonly isHighRes?: boolean;
	readonly isHeroSkin?: boolean;
}
