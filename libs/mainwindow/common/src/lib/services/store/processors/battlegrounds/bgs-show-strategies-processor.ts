import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Events } from '@firestone/shared/common/service';
import { ILocalizationService } from '@firestone/shared/framework/core';
import {
	BgsPersonalStatsSelectHeroDetailsEvent,
	BgsShowStrategiesEvent,
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';
import { BgsPersonalStatsSelectHeroDetailsProcessor } from './bgs-personal-stats-select-hero-details-processor';

export class BgsShowStrategiesProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: BgsShowStrategiesEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
