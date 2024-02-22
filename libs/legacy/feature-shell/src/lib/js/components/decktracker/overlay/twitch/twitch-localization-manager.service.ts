import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { mapTwitchLanguageToHsLocale } from './twitch-config-widget.component';
import { TwitchPreferencesService } from './twitch-preferences.service';

@Injectable()
export class TwitchLocalizationManagerService {
	constructor(
		private readonly translate: TranslateService,
		private readonly prefs: TwitchPreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public async init() {
		await this.setInitialLocale();
		this.prefs.preferences$$
			.pipe(
				debounceTime(200),
				map((prefs) => prefs.locale),
				distinctUntilChanged(),
			)
			.subscribe(async (locale) => {
				console.debug('setting locale', locale);
				await this.translate.use(locale).toPromise();
				await this.i18n.setLocale(locale);
				console.log('finished setting up locale', locale);
			});
	}

	private async setInitialLocale() {
		this.translate.setDefaultLang('enUS');
		const prefs = this.prefs.prefs.getValue();
		const localeFromPrefs = prefs.locale ?? 'auto';
		console.log('search params', window.location.search);
		const queryLanguage =
			localeFromPrefs === 'auto' ? new URLSearchParams(window.location.search).get('language') : localeFromPrefs;
		const locale = mapTwitchLanguageToHsLocale(queryLanguage);
		const newPrefs = { ...prefs, locale };
		await this.prefs.savePrefs(newPrefs);
		console.log('updating locale in prefs', locale);
	}
}
