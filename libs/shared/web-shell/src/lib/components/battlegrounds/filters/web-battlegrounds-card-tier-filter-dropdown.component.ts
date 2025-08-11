import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { BgsCardTierFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	BaseFilterWithUrlComponent,
	FilterUrlConfig,
	parseNumericArrayUrlParam,
} from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-card-tier-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-card-tier-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-tier-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsCardTierFilterDropdownComponent
	extends BaseFilterWithUrlComponent<readonly BgsCardTierFilterType[] | null, Preferences>
	implements AfterContentInit
{
	currentFilter$: Observable<readonly BgsCardTierFilterType[] | null>;

	protected filterConfig: FilterUrlConfig<readonly BgsCardTierFilterType[] | null, Preferences> = {
		paramName: 'tavernTiers',
		preferencePath: 'bgsActiveCardsTiers',
		parseUrlParam: (value: string | string[]): readonly BgsCardTierFilterType[] | null => {
			return parseNumericArrayUrlParam<BgsCardTierFilterType>(value, 1, undefined, null);
		},
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

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTiers));

		this.cdr.markForCheck();
	}

	onSelected(option: readonly BgsCardTierFilterType[]) {
		this.prefs.updatePrefs('bgsActiveCardsTiers', option);
	}
}
