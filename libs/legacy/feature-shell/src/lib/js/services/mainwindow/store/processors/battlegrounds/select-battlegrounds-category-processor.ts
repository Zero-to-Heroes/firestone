import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { SelectBattlegroundsCategoryEvent } from '@firestone/mainwindow/common';
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
