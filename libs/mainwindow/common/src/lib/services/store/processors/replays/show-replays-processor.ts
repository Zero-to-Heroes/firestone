import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
	ShowReplaysEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class ShowReplaysProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowReplaysEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		this.prefs.savePreferences({
			...prefs,
			replaysActiveDeckstringsFilter: [event.deckstring],
			replaysActiveGameModeFilter: event.gameMode,
		});
		this.mainNav.text$$.next(null);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('replays');
		return [null, null];
	}
}
