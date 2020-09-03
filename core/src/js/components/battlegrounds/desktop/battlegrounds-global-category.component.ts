import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsGlobalCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-global-category';
import { SelectBattlegroundsGlobalCategoryEvent } from '../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-global-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-global-category',
	styleUrls: [
		`../../../../css/component/battlegrounds/desktop/battlegrounds-global-category.component.scss`,
		`../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-global-category" (mousedown)="selectCategory()">
			<div class="logo" [inlineSVG]="categoryIcon"></div>
			<span class="text category-name">{{ displayName }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsGlobalCategoryComponent implements AfterViewInit {
	_category: BattlegroundsGlobalCategory;
	categoryIcon: string;
	displayName: string;

	@Input() set category(category: BattlegroundsGlobalCategory) {
		this._category = category;
		// this.categoryIcon = `/Files/assets/svg/achievements/categories/${category.icon}.svg`;
		this.displayName = category.name;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory() {
		this.stateUpdater.next(new SelectBattlegroundsGlobalCategoryEvent(this._category.id));
	}
}
