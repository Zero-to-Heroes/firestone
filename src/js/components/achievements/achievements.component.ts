import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementsState } from '../../models/mainwindow/achievements-state';
import { Navigation } from '../../models/mainwindow/navigation';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { VisualAchievement } from '../../models/visual-achievement';

const ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS = 150;

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/achievements/achievements.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div class="app-section achievements">
			<section class="main" [ngClass]="{ 'divider': state.currentView === 'list' }" [@viewState]="_viewState">
				<global-header [navigation]="navigation" *ngIf="navigation.text"> </global-header>
				<achievements-global-categories
					[hidden]="state.currentView !== 'categories'"
					[globalCategories]="state.globalCategories"
				>
				</achievements-global-categories>
				<achievements-categories
					[hidden]="state.currentView !== 'category'"
					[achievementSets]="getAchievementSets()"
				>
				</achievements-categories>
				<achievements-list
					[hidden]="state.currentView !== 'list'"
					[socialShareUserInfo]="socialShareUserInfo"
					[achievementsList]="getDisplayedAchievements()"
					[selectedAchievementId]="state.selectedAchievementId"
					[achievementSet]="getAchievementSet()"
					[globalStats]="globalStats"
				>
				</achievements-list>
				<achievement-sharing-modal
					[hidden]="!state.sharingAchievement"
					[socialShareUserInfo]="socialShareUserInfo"
					[sharingAchievement]="state.sharingAchievement"
				>
				</achievement-sharing-modal>
			</section>
			<section class="secondary">
				<achievement-history [achievementHistory]="state.achievementHistory"></achievement-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state(
				'hidden',
				style({
					opacity: 0,
					'pointer-events': 'none',
				}),
			),
			state(
				'shown',
				style({
					opacity: 1,
				}),
			),
			transition('hidden <=> shown', animate(`${ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		]),
	],
})
export class AchievementsComponent {
	@Input() state: AchievementsState;
	@Input() currentUser: CurrentUser;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	// TODO: should probably refactor how state is handled, so that we could
	// update the achievement text in a single place, instead of having
	// achievement logic spread out over multiple processors
	@Input() globalStats: GlobalStats;
	@Input() navigation: Navigation;

	_viewState = 'shown';

	getAchievementSet(): AchievementSet {
		if (!this.state.selectedCategoryId) {
			return null;
		}
		const currentGlobalCategory = this.state.globalCategories.find(
			cat => cat.id === this.state.selectedGlobalCategoryId,
		);
		if (!currentGlobalCategory) {
			return null;
		}
		return currentGlobalCategory.achievementSets.find(set => set.id === this.state.selectedCategoryId);
	}

	getAchievementSets(): readonly AchievementSet[] {
		// console.log('getting achievement sets', this.state);
		if (!this.state.selectedGlobalCategoryId) {
			return null;
		}
		const currentGlobalCategory = this.state.globalCategories.find(
			cat => cat.id === this.state.selectedGlobalCategoryId,
		);
		// console.log('will return', currentGlobalCategory.achievementSets);
		return currentGlobalCategory.achievementSets;
	}

	getDisplayedAchievements(): readonly VisualAchievement[] {
		if (!this.state.displayedAchievementsList || !this.state.achievementsList) {
			return null;
		}
		return this.state.globalCategories
			.map(globalCategory => globalCategory.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(ach => this.state.displayedAchievementsList.indexOf(ach.id) !== -1);
	}
}
