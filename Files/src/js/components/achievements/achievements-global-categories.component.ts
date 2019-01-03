import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { Events } from '../../services/events.service';
import { AchievementSet } from '../../models/achievement-set';
import { AchievementCategory } from '../../models/achievement-category';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

@Component({
	selector: 'achievements-global-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-global-categories.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`
	],
	template: `
		<div class="achievements-global-categories">
			<ul>
				<li *ngFor="let category of achievementCategories">
					<achievements-global-category [category]="category" (click)="selectCategory(category)">
					</achievements-global-category>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsGlobalCategoriesComponent {

	achievementCategories: VisualAchievementCategory[];
	
	private _achievementSets: AchievementSet[];
	private _categories: AchievementCategory[];

	@Input() set achievementSets(achievementSets: AchievementSet[]) {
		// console.log('setting achievementSets in global view', achievementSets, this._categories);
		this._achievementSets = achievementSets;
		this.createCategories();
	}

	@Input() set categories(categories: AchievementCategory[]) {
		// console.log('setting categories in global view', categories);
		this._categories = categories;
		this.createCategories();
	}

	constructor(private _events: Events) {
	}

	selectCategory(category: VisualAchievementCategory) {
		console.log('category selected', category);
		this._events.broadcast(Events.ACHIEVEMENT_CATEGORY_SELECTED, category);
	}

	private createCategories() {
		if (!this._categories || !this._achievementSets) {
			return;
		}
		// console.log('creating categories', this._categories, this._achievementSets);
		this.achievementCategories = this._categories
				.map((category) => {
					return {
						id: category.id,
						name: category.name,
						icon: category.icon,
						achievementSets: this.buildSetsForCategory(category.achievementSetIds)
					} as VisualAchievementCategory
				});
		// console.log('created categories', this.achievementCategories);
	}

	private buildSetsForCategory(achievementSetIds: string[]): AchievementSet[] {
		return this._achievementSets.filter((set) => achievementSetIds.indexOf(set.id) !== -1);
	}
}
