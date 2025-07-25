import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@legacy-import/src/lib/js/models/mainwindow/main-window-state';
import { NavigationState } from '@legacy-import/src/lib/js/models/mainwindow/navigation/navigation-state';
import { Events } from '../../../../events.service';
import { LocalizationService } from '../../../../localization.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { BgsShowStrategiesEvent } from '../../events/battlegrounds/bgs-show-strategies-event';
import { Processor } from '../processor';
import { BgsPersonalStatsSelectHeroDetailsProcessor } from './bgs-personal-stats-select-hero-details-processor';

export class BgsShowStrategiesProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: BgsShowStrategiesEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('battlegrounds');
		this.nav.selectedPersonalHeroStatsTab$$.next('strategies');
		return new BgsPersonalStatsSelectHeroDetailsProcessor(
			this.events,
			this.allCards,
			this.i18n,
			this.nav,
			this.mainNav,
		).process(
			new BgsPersonalStatsSelectHeroDetailsEvent(normalizeHeroCardId(event.heroId, this.allCards)),
			currentState,
			navigationState,
		);
	}
}
