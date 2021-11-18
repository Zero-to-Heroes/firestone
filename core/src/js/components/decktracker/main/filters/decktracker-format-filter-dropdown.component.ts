import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { StatGameFormatType } from '../../../../models/mainwindow/stats/stat-game-format.type';
import { ChangeDeckFormatFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-format-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFormatFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.gameFormat,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				map(([filter, currentView]) => {
					const options = [
						{
							value: 'all',
							label: 'All formats',
						} as FormatFilterOption,
						{
							value: 'standard',
							label: 'Standard',
						} as FormatFilterOption,
						{
							value: 'wild',
							label: 'Wild',
						} as FormatFilterOption,
						{
							value: 'classic',
							label: 'Classic',
						} as FormatFilterOption,
					] as readonly FormatFilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: currentView !== 'deck-details',
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: FormatFilterOption) {
		this.stateUpdater.next(new ChangeDeckFormatFilterEvent(option.value));
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}
