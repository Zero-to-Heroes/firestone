import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

@Component({
	selector: 'achievement-category',
	styleUrls: [`../../../css/component/achievements/achievement-category.component.scss`],
	template: `
		<achievement-category-view
			[empty]="empty"
			[complete]="complete"
			[displayName]="displayName"
			[categoryIcon]="categoryIcon"
			[achieved]="achieved"
			[totalAchievements]="totalAchievements"
		>
		</achievement-category-view>
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
