import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Events } from '@firestone/shared/common/service';
import {
	BgsPersonalStatsSelectHeroDetailsEvent,
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: BgsPersonalStatsSelectHeroDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		let newState = currentState;
		if (event.heroCardId !== currentState.battlegrounds.lastHeroPostMatchStatsHeroId) {
			this.events.broadcast(Events.POPULATE_HERO_DETAILS_FOR_BG, event.heroCardId);
			newState = currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					lastHeroPostMatchStats: undefined,
					lastHeroPostMatchStatsHeroId: event.heroCardId,
				}),
			});
		}

		this.nav.selectedCategoryId$$.next('bgs-category-personal-hero-details-' + event.heroCardId);
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		this.mainNav.text$$.next(
			this.allCards.getCard(event.heroCardId)?.name ?? this.i18n.translateString('app.battlegrounds.menu.heroes'),
		);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		return [newState, null];
	}
}
