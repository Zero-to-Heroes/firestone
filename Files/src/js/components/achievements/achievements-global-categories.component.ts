import { Component, ChangeDetectionStrategy, Input, AfterViewInit, EventEmitter } from '@angular/core';

import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-global-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-global-categories.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`
	],
	template: `
		<div class="achievements-global-categories">
			<ul>
				<li *ngFor="let category of globalCategories">
					<achievements-global-category [category]="category" (mousedown)="selectCategory(category)">
					</achievements-global-category>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsGlobalCategoriesComponent implements AfterViewInit {

	@Input() globalCategories: ReadonlyArray<VisualAchievementCategory>;
	
    private stateUpdater: EventEmitter<MainWindowStoreEvent>;
    
    constructor(private ow: OverwolfService) { }
	
	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(category: VisualAchievementCategory) {
		this.stateUpdater.next(new SelectAchievementCategoryEvent(category.id));
	}
}
