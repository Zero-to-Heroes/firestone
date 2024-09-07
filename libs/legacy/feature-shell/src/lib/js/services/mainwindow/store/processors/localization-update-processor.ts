import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { TranslateService } from '@ngx-translate/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { LocalizationUpdateEvent } from '../events/localization-update-event';
import { Processor } from './processor';

export class LocalizationUpdateProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly translate: TranslateService) {}

	public async process(
		event: LocalizationUpdateEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('updating localization', event.locale);
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, locale: event.locale };
		// TODO: remove the event, and have the translate service listen to the prefs and update itself when the pref changes
		await this.prefs.savePreferences(newPrefs);
		await this.translate.use(event.locale).toPromise();
		console.log('updated localization', event.locale);
		return [null, null];
	}
}
