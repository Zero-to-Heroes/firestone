import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/battlegrounds/desktop/filters/_battlegrounds-filters.component.scss`,
	],
	template: `
		<div class="battlegrounds-filters" [attr.aria-label]="'Battlegrounds filters'" role="list">
			<region-filter-dropdown class="filter" *ngIf="showRegionFilter$ | async"></region-filter-dropdown>
			<battlegrounds-hero-sort-dropdown class="hero-sort"></battlegrounds-hero-sort-dropdown>
			<battlegrounds-hero-filter-dropdown class="hero-filter"></battlegrounds-hero-filter-dropdown>
			<battlegrounds-rank-filter-dropdown class="rank-filter"></battlegrounds-rank-filter-dropdown>
			<battlegrounds-tribes-filter-dropdown class="tribes-filter"></battlegrounds-tribes-filter-dropdown>
			<battlegrounds-rank-group-dropdown class="rank-group"></battlegrounds-rank-group-dropdown>
			<battlegrounds-time-filter-dropdown class="time-filter"></battlegrounds-time-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsFiltersComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showRegionFilter$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showRegionFilter$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationBattlegrounds.selectedCategoryId)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(
					([currentView]) =>
						currentView !== 'bgs-category-personal-stats' &&
						currentView !== 'bgs-category-perfect-games' &&
						currentView !== 'bgs-category-simulator',
				),
			);
	}
}
