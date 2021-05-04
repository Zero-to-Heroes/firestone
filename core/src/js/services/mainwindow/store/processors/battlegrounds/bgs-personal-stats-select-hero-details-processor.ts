import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../../events.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsProcessor implements Processor {
	constructor(private readonly events: Events, private readonly allCards: AllCardsService) {}

	public async process(
		event: BgsPersonalStatsSelectHeroDetailsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.events.broadcast(Events.POPULATE_HERO_DETAILS_FOR_BG, event.heroCardId);
		const category: BattlegroundsPersonalStatsHeroDetailsCategory = BattlegroundsAppState.findCategory(
			currentState.battlegrounds,
			'bgs-category-personal-hero-details-' + event.heroCardId,
		) as BattlegroundsPersonalStatsHeroDetailsCategory;
		// const newBattlegrounds = currentState.battlegrounds.update({
		// 	lastHeroPostMatchStats: null,
		// } as BattlegroundsAppState);

		const globalCategory = currentState.battlegrounds.globalCategories.find((globalCategory) =>
			globalCategory.hasSubCategory(category.id),
		);
		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: category.id,
		} as NavigationBattlegrounds);
		return [
			// currentState.update({
			// 	battlegrounds: newBattlegrounds,
			// } as MainWindowState),
			null,
			navigationState.update({
				isVisible: true,
				navigationBattlegrounds: navigationBattlegrounds,
				text: this.allCards.getCard(event.heroCardId)?.name ?? 'Heroes',
				image: null,
			} as NavigationState),
		];
	}
}
