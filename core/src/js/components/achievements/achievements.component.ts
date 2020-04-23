import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementsState } from '../../models/mainwindow/achievements-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/achievements/achievements.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div class="app-section achievements">
			<section class="main" [ngClass]="{ 'divider': navigation.navigationAchievements.currentView === 'list' }">
				<with-loading [isLoading]="state.isLoading">
					<global-header [navigation]="navigation" *ngIf="navigation.text"></global-header>
					<achievements-global-categories
						[hidden]="navigation.navigationAchievements.currentView !== 'categories'"
						[globalCategories]="state.globalCategories"
					>
					</achievements-global-categories>
					<achievements-categories
						[hidden]="navigation.navigationAchievements.currentView !== 'category'"
						[achievementSets]="getAchievementSets()"
					>
					</achievements-categories>
					<achievements-list
						[hidden]="navigation.navigationAchievements.currentView !== 'list'"
						[socialShareUserInfo]="socialShareUserInfo"
						[achievementsList]="getDisplayedAchievements()"
						[selectedAchievementId]="navigation.navigationAchievements.selectedAchievementId"
						[achievementSet]="getAchievementSet()"
						[activeFilter]="navigation.navigationAchievements.achievementActiveFilter"
						[globalStats]="globalStats"
					>
					</achievements-list>
					<achievement-sharing-modal
						[hidden]="!navigation.navigationAchievements.sharingAchievement"
						[socialShareUserInfo]="socialShareUserInfo"
						[sharingAchievement]="navigation.navigationAchievements.sharingAchievement"
					>
					</achievement-sharing-modal>
				</with-loading>
			</section>
			<section class="secondary">
				<achievement-history [achievementHistory]="state.achievementHistory"></achievement-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent {
	@Input() state: AchievementsState;
	// @Input() nonNavigationState: NonNavigationState;
	@Input() currentUser: CurrentUser;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	// TODO: should probably refactor how state is handled, so that we could
	// update the achievement text in a single place, instead of having
	// achievement logic spread out over multiple processors
	@Input() globalStats: GlobalStats;
	@Input() navigation: NavigationState;

	getAchievementSet(): AchievementSet {
		// console.log('[achievements] getting achievement set', this.state);
		if (!this.navigation.navigationAchievements.selectedCategoryId) {
			return null;
		}
		const currentGlobalCategory = this.state.globalCategories.find(
			cat => cat.id === this.navigation.navigationAchievements.selectedGlobalCategoryId,
		);
		// console.log('[achievements] currentGlobalCategory', currentGlobalCategory);
		if (!currentGlobalCategory) {
			return null;
		}
		// console.log(
		// 	'[achievements] creturning set',
		// 	currentGlobalCategory.achievementSets.find(set => set.id === this.state.selectedCategoryId),
		// );
		return currentGlobalCategory.achievementSets.find(
			set => set.id === this.navigation.navigationAchievements.selectedCategoryId,
		);
	}

	getAchievementSets(): readonly AchievementSet[] {
		// console.log('getting achievement sets', this.state);
		if (!this.navigation.navigationAchievements.selectedGlobalCategoryId) {
			return null;
		}
		const currentGlobalCategory = this.state.globalCategories.find(
			cat => cat.id === this.navigation.navigationAchievements.selectedGlobalCategoryId,
		);
		// console.log('will return', currentGlobalCategory.achievementSets);
		return currentGlobalCategory.achievementSets;
	}

	getDisplayedAchievements(): readonly VisualAchievement[] {
		if (
			!this.navigation?.navigationAchievements?.displayedAchievementsList ||
			!this.navigation?.navigationAchievements?.achievementsList ||
			!this.state?.globalCategories
		) {
			return [];
		}
		return this.state.globalCategories
			.map(globalCategory => globalCategory.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(ach => this.navigation.navigationAchievements.displayedAchievementsList.indexOf(ach.id) !== -1);
	}
}
