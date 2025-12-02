import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, CardTurnFilterOption, RankFilterOption } from '@firestone/battlegrounds/view';
import {
	BgsCardTypeFilterType,
	BgsRankFilterType,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { filter, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-card-type-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-card-type-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-type-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsCardTypeFilterDropdownComponent
	extends BaseFilterWithUrlComponent<BgsCardTypeFilterType, Preferences>
	implements AfterContentInit
{
	currentFilter$: Observable<BgsCardTypeFilterType>;

	protected filterConfig: FilterUrlConfig<BgsCardTypeFilterType, Preferences> = {
		paramName: 'type',
		preferencePath: 'bgsActiveCardsCardType',
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

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsCardType));

		this.cdr.detectChanges();
	}

	onSelected(value: BgsCardTypeFilterType) {
		this.prefs.updatePrefs('bgsActiveCardsCardType', value);
	}
}
