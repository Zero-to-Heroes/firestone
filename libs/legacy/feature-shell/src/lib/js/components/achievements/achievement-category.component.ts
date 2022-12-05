import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

@Component({
	selector: 'achievement-category',
	styleUrls: [`../../../css/component/achievements/achievement-category.component.scss`],
	template: `
		<div class="achievement-set" [ngClass]="{ empty: empty }">
			<div class="frame complete-simple" *ngIf="complete">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
			</div>
			<span class="text set-name" [helpTooltip]="displayName">{{ displayName }}</span>
			<i class="logo" [inlineSVG]="categoryIcon"> </i>
			<achievement-progress-bar [achieved]="achieved" [total]="totalAchievements"></achievement-progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementCategoryComponent {
	_category: VisualAchievementCategory;
	achieved: number;
	totalAchievements: number;
	displayName: string;
	categoryIcon: string;
	complete = false;
	empty = false;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	@Input() set category(value: VisualAchievementCategory) {
		this._category = value;
		if (value) {
			this.categoryIcon = `assets/svg/achievements/categories/${value.icon}.svg`;
			this.displayName = value.name;
			const aggregatedAchievements = value.retrieveAllAchievements();
			const flatCompletions = aggregatedAchievements
				.map((achievement) => achievement.completionSteps)
				.reduce((a, b) => a.concat(b), []);
			this.totalAchievements = flatCompletions.length;
			this.achieved = flatCompletions.filter((a) => a.numberOfCompletions > 0).length;
			this.empty = this.achieved === 0;
			this.complete = this.totalAchievements === this.achieved && !this.empty;
			// Without the timeout I get a "detectChanges is not a function" error?
			setTimeout(() => {
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		}
	}
}
