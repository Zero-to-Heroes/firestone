import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesToggleShowHiddenTeamsEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-toggle-show-hidden-teams-event';

@Component({
	standalone: false,
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
export class MercenariesFiltersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showHiddenTeamsLink$: Observable<boolean>;
	showRegionFilter$: Observable<boolean>;
	showSearch$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: MainWindowNavigationService,
		private readonly prefs: PreferencesService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs, this.mainWindowStateFacade);

		this.showHiddenTeamsLink$ = combineLatest([
			this.nav.navigationState$$.pipe(this.mapData((state) => state.navigationMercenaries.selectedCategoryId)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesHiddenTeamIds)),
		]).pipe(
			filter(([currentView, hiddenTeamIds]) => !!currentView && !!hiddenTeamIds),
			this.mapData(
				([currentView, hiddenTeamIds]) => currentView === 'mercenaries-my-teams' && hiddenTeamIds.length > 0,
			),
		);
		this.showRegionFilter$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationMercenaries.selectedCategoryId),
			filter((currentView) => !!currentView),
			this.mapData((currentView) => currentView === 'mercenaries-my-teams'),
		);
		this.showSearch$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationMercenaries.selectedCategoryId),
			filter((currentView) => !!currentView),
			this.mapData((currentView) => currentView === 'mercenaries-personal-hero-stats'),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.mainWindowStateFacade.send(new MercenariesToggleShowHiddenTeamsEvent(newValue));
	};
}
