import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsHeroStatsFilterId } from '@legacy-import/src/lib/js/models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { LocalizationService } from '@services/localization.service';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../../events.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationService,
	) {}

	public async process(
		event: BgsPersonalStatsSelectHeroDetailsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const category: BattlegroundsPersonalStatsHeroDetailsCategory =
			BattlegroundsPersonalStatsHeroDetailsCategory.create({
				id: 'bgs-category-personal-hero-details-' + event.heroCardId,
				name: this.allCards.getCard(event.heroCardId)?.name,
				heroId: event.heroCardId,
				tabs: [
					'strategies',
					'winrate-stats',
					// Graph is buggy at the moment, and is not super useful, so let's scrap it for now
					// 'mmr',
					'warband-stats',
					'final-warbands',
				] as readonly BgsHeroStatsFilterId[],
			} as BattlegroundsPersonalStatsHeroDetailsCategory);
		let newState = currentState;
		if (event.heroCardId !== currentState.battlegrounds.lastHeroPostMatchStatsHeroId) {
			this.events.broadcast(Events.POPULATE_HERO_DETAILS_FOR_BG, event.heroCardId);
			newState = currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					lastHeroPostMatchStats: null,
					lastHeroPostMatchStatsHeroId: event.heroCardId,
				}),
			});
		}

		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: category.id,
		} as NavigationBattlegrounds);
		return [
			newState,
			navigationState.update({
				isVisible: true,
				navigationBattlegrounds: navigationBattlegrounds,
				text:
					this.allCards.getCard(event.heroCardId)?.name ??
					this.i18n.translateString('app.battlegrounds.menu.heroes'),
				image: null,
			} as NavigationState),
		];
	}
}
