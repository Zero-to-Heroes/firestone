import { CurrentView } from '../achievement/current-view.type';
import { SharingAchievement } from '../achievement/sharing-achievement';

export class NavigationAchievements {
	readonly currentView: CurrentView = 'categories';
	readonly menuDisplayType: string = 'menu';
	// readonly selectedGlobalCategoryId: string;
	readonly selectedCategoryId: string;
	readonly selectedAchievementId: string;
	readonly achievementActiveFilter: string;
	// readonly achievementsList: readonly string[] = [];
	// Holds the IDs of the achievements to display
	readonly displayedAchievementsList: readonly string[] = [];
	readonly sharingAchievement: SharingAchievement;
	// We use this when hitting the back button, or when clearing the search box
	readonly viewBeforeSearch?: CurrentView;
	readonly textBeforeSearch?: string;

	public update(base: NavigationAchievements): NavigationAchievements {
		return Object.assign(new NavigationAchievements(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
