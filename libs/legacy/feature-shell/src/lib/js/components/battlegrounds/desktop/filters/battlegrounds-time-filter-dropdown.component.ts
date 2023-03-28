import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { TimeFilterOption } from '@firestone/battlegrounds/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-time-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-time-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-time-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[timePeriods]="timePeriods"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></battlegrounds-time-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	timePeriods: readonly BgsActiveTimeFilterType[];
	currentFilter$: Observable<BgsActiveTimeFilterType>;
	visible$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.timePeriods = ['all-time', 'past-seven', 'past-three', 'last-patch'];
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveTimeFilter);
		this.visible$ = this.store
			.listen$(
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([categoryId, currentView]) => !!categoryId && !!currentView),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				this.mapData(
					([categoryId, currentView]) =>
						!['categories', 'category'].includes(currentView) &&
						![
							'bgs-category-personal-stats',
							'bgs-category-perfect-games',
							'bgs-category-simulator',
						].includes(categoryId),
				),
			);
	}

	onSelected(option: IOption) {
		this.store.send(new BgsTimeFilterSelectedEvent((option as TimeFilterOption).value));
	}
}
