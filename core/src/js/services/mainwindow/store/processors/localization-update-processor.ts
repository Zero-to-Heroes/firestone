import { TranslateService } from '@ngx-translate/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../preferences.service';
import { LocalizationUpdateEvent } from '../events/localization-update-event';
import { Processor } from './processor';

export class LocalizationUpdateProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly translate: TranslateService) {}

	public async process(
		event: LocalizationUpdateEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('updating localization', event.locale);
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, locale: event.locale };
		await this.prefs.savePreferences(newPrefs);
		await this.translate.use(prefs.locale).toPromise();
		console.log('updated localization', event.locale);
		return [null, null];
	}
}
