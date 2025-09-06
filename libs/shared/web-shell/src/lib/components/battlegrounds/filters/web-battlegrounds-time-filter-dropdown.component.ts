import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, TimeFilterOption } from '@firestone/battlegrounds/view';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-time-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-time-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[timePeriods]="timePeriods"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-time-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsTimeFilterDropdownComponent
	extends BaseFilterWithUrlComponent<BgsActiveTimeFilterType, Preferences>
	implements AfterContentInit
{
	timePeriods: readonly BgsActiveTimeFilterType[];
	currentFilter$: Observable<BgsActiveTimeFilterType>;

	protected filterConfig: FilterUrlConfig<BgsActiveTimeFilterType, Preferences> = {
		paramName: 'bgsActiveTimeFilter',
		preferencePath: 'bgsActiveTimeFilter',
		validValues: ['all-time', 'past-seven', 'past-three', 'last-patch'],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		protected override readonly prefs: PreferencesService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.timePeriods = ['all-time', 'past-seven', 'past-three', 'last-patch'];
		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTimeFilter));

		this.cdr.detectChanges();
	}

	onSelected(option: TimeFilterOption) {
		console.debug('selected option', option);
		this.prefs.updatePrefs('bgsActiveTimeFilter', option.value as BgsActiveTimeFilterType);
	}
}
