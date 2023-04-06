import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { DuelsTimeFilterType } from '@firestone/duels/data-access';
import { TimePeriod } from '@firestone/duels/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { formatPatch } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-time-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-time-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[timePeriods]="timePeriods$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></duels-time-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	timePeriods$: Observable<readonly TimePeriod[]>;
	currentFilter$: Observable<DuelsTimeFilterType>;
	visible$: Observable<boolean>;

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
		this.timePeriods$ = this.store
			.listen$(([main, nav]) => main.duels.currentDuelsMetaPatch)
			.pipe(
				this.mapData(([patch]) => {
					return [
						{ value: 'all-time' },
						{ value: 'past-seven' },
						{ value: 'past-three' },
						{ value: 'last-patch', tooltip: formatPatch(patch, this.i18n) },
					];
				}),
			);
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveTimeFilter);
		this.visible$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId)
			.pipe(
				filter(([categoryId]) => !!categoryId),
				this.mapData(([categoryId]) =>
					[
						'duels-stats',
						'duels-runs',
						'duels-personal-decks',
						'duels-personal-deck-details',
						'duels-top-decks',
						'duels-treasures',
					].includes(categoryId),
				),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new DuelsTimeFilterSelectedEvent((option as TimeFilterOption).value));
	}
}

interface TimeFilterOption extends IOption {
	value: DuelsTimeFilterType;
}
