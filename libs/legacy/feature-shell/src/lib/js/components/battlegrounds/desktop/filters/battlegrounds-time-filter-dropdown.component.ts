import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { TimeFilterOption } from '@firestone/battlegrounds/view';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.timePeriods = ['all-time', 'past-seven', 'past-three', 'last-patch'];
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveTimeFilter);
		this.visible$ = combineLatest([
			this.nav.selectedCategoryId$$,
			this.store.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView),
		]).pipe(
			filter(([categoryId, [currentView]]) => !!categoryId && !!currentView),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(
				([categoryId, [currentView]]) =>
					!['categories', 'category'].includes(currentView) &&
					![
						'bgs-category-personal-stats',
						'bgs-category-perfect-games',
						'bgs-category-simulator',
						'bgs-category-leaderboard',
					].includes(categoryId),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(option: IOption) {
		this.store.send(new BgsTimeFilterSelectedEvent((option as TimeFilterOption).value));
	}
}
