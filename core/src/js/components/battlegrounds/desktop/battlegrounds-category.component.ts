import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { SelectBattlegroundsCategoryEvent } from '../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-category',
	styleUrls: [
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category.component.scss`,
		`../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-category" [ngClass]="{ 'disabled': disabled }" (mousedown)="selectCategory()">
			<div class="logo" [inlineSVG]="categoryIcon"></div>
			<span class="text category-name">{{ displayName }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryComponent implements AfterViewInit {
	_category: BattlegroundsCategory;
	categoryIcon: string;
	displayName: string;
	disabled: boolean;

	@Input() set category(category: BattlegroundsCategory) {
		this._category = category;
		// this.categoryIcon = `/Files/assets/svg/achievements/categories/${category.icon}.svg`;
		this.displayName = category.name;
		this.disabled = !category.enabled;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectCategory() {
		this.stateUpdater.next(new SelectBattlegroundsCategoryEvent(this._category.id));
	}
}
