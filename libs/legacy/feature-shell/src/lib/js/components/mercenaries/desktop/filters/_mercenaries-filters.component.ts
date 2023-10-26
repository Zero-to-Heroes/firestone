import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesToggleShowHiddenTeamsEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-toggle-show-hidden-teams-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'mercenaries-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/mercenaries/desktop/filters/_mercenaries-filters.component.scss`,
	],
	template: `
		<div class="mercenaries-filters">
			<region-filter-dropdown class="filter" *ngIf="showRegionFilter$ | async"></region-filter-dropdown>
			<mercenaries-hero-level-filter-dropdown class="level"></mercenaries-hero-level-filter-dropdown>
			<mercenaries-fully-upgraded-filter-dropdown
				class="fully-upgraded"
			></mercenaries-fully-upgraded-filter-dropdown>
			<mercenaries-owned-filter-dropdown class="owned"></mercenaries-owned-filter-dropdown>

			<mercenaries-hero-search *ngIf="showSearch$ | async"></mercenaries-hero-search>

			<preference-toggle
				class="show-hidden-teams-link"
				*ngIf="showHiddenTeamsLink$ | async"
				field="mercenariesShowHiddenTeams"
				[label]="'mercenaries.filters.show-hidden-teams-link-label' | owTranslate"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesFiltersComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showHiddenTeamsLink$: Observable<boolean>;
	showRegionFilter$: Observable<boolean>;
	showSearch$: Observable<boolean>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showHiddenTeamsLink$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationMercenaries.selectedCategoryId,
				([main, nav, prefs]) => prefs.mercenariesHiddenTeamIds,
			)
			.pipe(
				filter(([currentView, hiddenTeamIds]) => !!currentView && !!hiddenTeamIds),
				this.mapData(
					([currentView, hiddenTeamIds]) =>
						currentView === 'mercenaries-my-teams' && hiddenTeamIds.length > 0,
				),
			);
		this.showRegionFilter$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationMercenaries.selectedCategoryId)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(([currentView]) => currentView === 'mercenaries-my-teams'),
			);
		this.showSearch$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationMercenaries.selectedCategoryId)
			.pipe(
				filter(([currentView]) => !!currentView),
				this.mapData(([currentView]) => currentView === 'mercenaries-personal-hero-stats'),
			);
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.store.send(new MercenariesToggleShowHiddenTeamsEvent(newValue));
	};
}
