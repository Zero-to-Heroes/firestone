import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, CardTurnFilterOption, RankFilterOption } from '@firestone/battlegrounds/view';
import { BgsRankFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { filter, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-card-turn-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-card-turn-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-turn-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsCardTurnFilterDropdownComponent
	extends BaseFilterWithUrlComponent<number | null, Preferences>
	implements AfterContentInit
{
	currentFilter$: Observable<number | null>;

	protected filterConfig: FilterUrlConfig<number | null, Preferences> = {
		paramName: 'turns',
		preferencePath: 'bgsActiveCardsTurn',
		parseUrlParam: (value: string | string[]): number | null => {
			// Handle both string and string[] (Angular Router can return either)
			const strValue = Array.isArray(value) ? value[0] : value;
			if (!strValue || strValue.trim() === '') {
				return null;
			}
			const parsed = parseInt(strValue, 10);
			return isNaN(parsed) ? null : parsed;
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

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTurn));

		this.cdr.markForCheck();
	}

	onSelected(option: CardTurnFilterOption) {
		this.prefs.updatePrefs('bgsActiveCardsTurn', option.value == null ? null : +option.value);
	}
}
