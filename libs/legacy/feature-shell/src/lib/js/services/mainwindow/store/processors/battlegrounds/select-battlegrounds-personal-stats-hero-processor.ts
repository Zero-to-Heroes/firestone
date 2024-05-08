import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectBattlegroundsPersonalStatsHeroTabEvent } from '../../events/battlegrounds/select-battlegrounds-personal-stats-hero-event';
import { Processor } from '../processor';

export class SelectBattlegroundsPersonalStatsHeroProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: SelectBattlegroundsPersonalStatsHeroTabEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			selectedPersonalHeroStatsTab: event.tab,
		} as NavigationBattlegrounds);
		this.mainNav.isVisible$$.next(true);

		return [
			null,
			navigationState.update({
				navigationBattlegrounds: navigationBattlegrounds,
			} as NavigationState),
		];
	}
}
