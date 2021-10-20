import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsClassFilterType } from '../../../../models/duels/duels-class-filter.type';
import { classes, formatClass } from '../../../../services/hs-utils';
import { DuelsTopDecksClassFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-class-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-class-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-class-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsClassFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	options: readonly ClassFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		super();
		this.options = ['all', ...(classes as DuelsClassFilterType[])].map(
			(option) =>
				({
					value: option,
					label: option === 'all' ? 'All classes' : formatClass(option),
				} as ClassFilterOption),
		);
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				takeUntil(this.destroyed$),
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: [
						'duels-stats',
						'duels-runs',
						'duels-treasures',
						'duels-personal-decks',
						'duels-top-decks',
					].includes(selectedCategoryId),
				})),
				// Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: ClassFilterOption) {
		this.stateUpdater.next(new DuelsTopDecksClassFilterSelectedEvent(option.value));
	}
}

interface ClassFilterOption extends IOption {
	value: DuelsClassFilterType;
}
