import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { AchievementsState } from '../../models/mainwindow/achievements-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/global/components-global.scss`,
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="app-section achievements">
			<section class="main" [ngClass]="{ 'divider': navigation.navigationAchievements.currentView === 'list' }">
				<with-loading [isLoading]="state.isLoading">
					<div class="content main-content">
						<global-header [navigation]="navigation" *ngIf="navigation.text"></global-header>

						<achievements-categories
							*ngxCacheIf="navigation.navigationAchievements.currentView === 'categories'"
							[categories]="getCategories()"
						>
						</achievements-categories>
						<achievements-list
							*ngxCacheIf="navigation.navigationAchievements.currentView === 'list'"
							[socialShareUserInfo]="socialShareUserInfo"
							[achievementsList]="getDisplayedAchievements()"
							[selectedAchievementId]="navigation.navigationAchievements.selectedAchievementId"
							[activeFilter]="navigation.navigationAchievements.achievementActiveFilter"
							[globalStats]="globalStats"
						>
						</achievements-list>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<achievements-filter></achievements-filter>
				<achievement-history [achievementHistory]="state.achievementHistory"></achievement-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent {
	@Input() state: AchievementsState;
	@Input() currentUser: CurrentUser;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	// TODO: should probably refactor how state is handled, so that we could
	// update the achievement text in a single place, instead of having
	// achievement logic spread out over multiple processors
	@Input() globalStats: GlobalStats;
	@Input() navigation: NavigationState;

	getCategories() {
		if (!this.navigation.navigationAchievements.selectedCategoryId) {
			return this.state.categories;
		}
		const currentCategory = this.state.findCategory(this.navigation.navigationAchievements.selectedCategoryId);
		return currentCategory.categories;
	}

	// getCategory(): VisualAchievementCategory {
	// 	if (!this.navigation.navigationAchievements.selectedCategoryId) {
	// 		return null;
	// 	}
	// 	const currentCategory: VisualAchievementCategory = this.state.findCategory(
	// 		this.navigation.navigationAchievements.selectedCategoryId,
	// 	);
	// 	return currentCategory;
	// }

	getDisplayedAchievements(): readonly VisualAchievement[] {
		return this.state.findAchievements(this.navigation.navigationAchievements.displayedAchievementsList);
	}
}
