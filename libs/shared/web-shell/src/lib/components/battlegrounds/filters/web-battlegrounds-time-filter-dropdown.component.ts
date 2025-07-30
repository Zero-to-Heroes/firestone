import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, TimeFilterOption } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	timePeriods: readonly BgsActiveTimeFilterType[];
	currentFilter$: Observable<BgsActiveTimeFilterType>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.timePeriods = ['all-time', 'past-seven', 'past-three', 'last-patch'];
		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTimeFilter));

		this.cdr.detectChanges();
	}

	onSelected(option: TimeFilterOption) {
		console.debug('selected option', option);
		this.prefs.updatePrefs('bgsActiveTimeFilter', option.value as BgsActiveTimeFilterType);
	}
}
