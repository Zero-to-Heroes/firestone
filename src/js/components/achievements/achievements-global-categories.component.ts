import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
} from '@angular/core';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-global-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-global-categories.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="achievements-global-categories">
			<ul class="achievements-global-categories-list">
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
	@Input() globalCategories: readonly VisualAchievementCategory[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory(category: VisualAchievementCategory) {
		this.stateUpdater.next(new SelectAchievementCategoryEvent(category.id));
	}
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const achievementsList = this.el.nativeElement.querySelector('.achievements-global-categories-list');
		if (!achievementsList) {
			return;
		}
		const rect = achievementsList.getBoundingClientRect();
		// console.log('element rect', rect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}
