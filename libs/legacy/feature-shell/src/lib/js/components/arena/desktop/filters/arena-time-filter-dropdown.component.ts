import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaTimeFilterType } from '../../../../models/arena/arena-time-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ArenaTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/arena/arena-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { formatPatch } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

/** This approach seems to be the cleanest way to properly narrow down the values needed from
 * the state. The other approaches are cool and data-driven, but as of now they seem more
 * difficult to implement with a store approach. The other filters might have to be refactored
 * to this approach
 */
@Component({
	selector: 'arena-time-filter-dropdown',
	styleUrls: [],
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
export class ArenaTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
				([main, nav]) => nav.navigationArena.selectedCategoryId,
			)
			.pipe(
				filter(([filter, patch, selectedCategoryId]) => !!filter && !!patch && !!selectedCategoryId),
				this.mapData(([filter, patch, selectedCategoryId]) => {
					const options: TimeFilterOption[] = [
						{
							value: 'all-time',
							label: this.i18n.translateString('app.arena.filters.time.past-100'),
						} as TimeFilterOption,
						{
							value: 'last-patch',
							label: this.i18n.translateString('app.arena.filters.time.last-patch'),
							tooltip: formatPatch(patch, this.i18n),
						} as TimeFilterOption,
						{
							value: 'past-seven',
							label: this.i18n.translateString('app.arena.filters.time.past-seven'),
						} as TimeFilterOption,
						{
							value: 'past-three',
							label: this.i18n.translateString('app.arena.filters.time.past-three'),
						} as TimeFilterOption,
					];
					return {
						filter: filter,
						options: options,
						placeholder:
							options.find((option) => option.value === filter)?.label ??
							this.i18n.translateString('app.arena.filters.time.past-100'),
						visible: true,
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ArenaTimeFilterSelectedEvent((option as TimeFilterOption).value));
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
