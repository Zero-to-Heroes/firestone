import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

@Injectable()
export class LocalizationService {
	private locale = 'enUS';
	private useHighResImages: boolean;

	constructor(private readonly store: AppUiStoreFacadeService) {}

	public start() {
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

	public getCardImage(
		cardId: string,
		options?: { isBgs?: boolean; isPremium?: boolean; isHighRes?: boolean },
	): string {
		const base = `https://static.firestoneapp.com/cards/${options?.isBgs ? 'bgs/' : ''}${this.locale}/${
			this.useHighResImages || options?.isHighRes ? '512' : '256'
		}`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}`;
	}
}
