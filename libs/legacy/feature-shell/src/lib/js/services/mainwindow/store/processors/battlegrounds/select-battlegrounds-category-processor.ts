import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectBattlegroundsCategoryEvent } from '../../events/battlegrounds/select-battlegrounds-category-event';
import { Processor } from '../processor';

export class SelectBattlegroundsCategoryProcessor implements Processor {
	constructor(
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: SelectBattlegroundsCategoryEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.nav.selectedCategoryId$$.next(event.categoryId);
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('menu');
		this.mainNav.text$$.next(null);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		return [null, null];
	}
}
