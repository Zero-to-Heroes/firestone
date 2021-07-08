import { AllCardsService } from '@firestone-hs/replay-parser';
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
		const category: BattlegroundsPersonalStatsHeroDetailsCategory = currentState.battlegrounds.findCategory(
			'bgs-category-personal-hero-details-' + event.heroCardId,
		) as BattlegroundsPersonalStatsHeroDetailsCategory;
		const currentHeroId = category?.heroId;
		console.debug('[gr] new hero?', currentHeroId, event, category, currentState, navigationState);
		if (event.heroCardId !== currentState.battlegrounds.lastHeroPostMatchStatsHeroId) {
			console.debug('[gr] new hero');
			this.events.broadcast(Events.POPULATE_HERO_DETAILS_FOR_BG, event.heroCardId);
		}

		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: category.id,
		} as NavigationBattlegrounds);
		return [
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
