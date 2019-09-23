import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { AchievementsState } from '../../models/mainwindow/achievements-state';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';

const ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS = 150;

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/achievements/achievements.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div class="achievements">
			<section class="main" [ngClass]="{ 'divider': state.currentView === 'list' }" [@viewState]="_viewState">
				<achievements-menu
					[ngClass]="{ 'shrink': state.shortDisplay }"
					[displayType]="state.menuDisplayType"
					[selectedCategory]="state.selectedGlobalCategory"
					[selectedAchievementSet]="state.selectedCategory"
				>
				</achievements-menu>
				<achievements-global-categories
					[hidden]="state.currentView !== 'categories'"
					[globalCategories]="state.globalCategories"
				>
				</achievements-global-categories>
				<achievements-categories
					[hidden]="state.currentView !== 'category'"
					[achievementSets]="state.achievementCategories"
				>
				</achievements-categories>
				<achievements-list
					[hidden]="state.currentView !== 'list'"
					[shortDisplay]="state.shortDisplay"
					[socialShareUserInfo]="socialShareUserInfo"
					[achievementsList]="state.achievementsList"
					[selectedAchievementId]="state.selectedAchievementId"
					[achievementSet]="state.selectedCategory"
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
	@Input() socialShareUserInfo: SocialShareUserInfo;

	_viewState = 'shown';
}
