import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievements-global-category',
	styleUrls: [
		`../../../css/component/achievements/achievements-global-category.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div class="achievements-global-category" [ngClass]="{ 'empty': empty }">
			<div class="frame complete-simple" *ngIf="complete">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
			</div>
			<span class="text category-name">{{ displayName }}</span>
			<div class="logo" [inlineSVG]="categoryIcon"></div>
			<achievement-progress-bar [achievements]="allAchievements"></achievement-progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsGlobalCategoryComponent {
	_category: VisualAchievementCategory;

	allAchievements: readonly VisualAchievement[];
	displayName: string;
	categoryIcon: string;
	complete = false;
	empty = false;

	@Input('category') set category(category: VisualAchievementCategory) {
		this._category = category;
		this.categoryIcon = `/Files/assets/svg/achievements/categories/${category.icon}.svg`;
		this.displayName = category.name;
		this.allAchievements = category.achievementSets.map(set => set.achievements).reduce((a, b) => a.concat(b), []);
		const flatCompletions = this.allAchievements.map(achievement => achievement.completionSteps).reduce((a, b) => a.concat(b), []);
		const total = flatCompletions.length;
		const achieved = flatCompletions.filter(a => a.numberOfCompletions > 0).length;
		this.complete = total === achieved && total > 0;
		this.empty = achieved === 0;
	}
}
