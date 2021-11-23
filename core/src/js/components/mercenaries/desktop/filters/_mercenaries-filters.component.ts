import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesToggleShowHiddenTeamsEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-toggle-show-hidden-teams-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/mercenaries/desktop/filters/_mercenaries-filters.component.scss`,
	],
	template: `
		<div class="mercenaries-filters">
			<mercenaries-mode-filter-dropdown class="mode"></mercenaries-mode-filter-dropdown>
			<mercenaries-pve-difficulty-filter-dropdown
				class="pve-difficulty"
			></mercenaries-pve-difficulty-filter-dropdown>
			<mercenaries-pvp-mmr-filter-dropdown class="pvp-mmr"></mercenaries-pvp-mmr-filter-dropdown>
			<mercenaries-role-filter-dropdown class="role"></mercenaries-role-filter-dropdown>
			<mercenaries-hero-level-filter-dropdown class="level"></mercenaries-hero-level-filter-dropdown>
			<mercenaries-starter-filter-dropdown class="starter"></mercenaries-starter-filter-dropdown>
			<mercenaries-fully-upgraded-filter-dropdown
				class="fully-upgraded"
			></mercenaries-fully-upgraded-filter-dropdown>

			<preference-toggle
				class="show-hidden-teams-link"
				*ngIf="showHiddenTeamsLink$ | async"
				field="mercenariesShowHiddenTeams"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
			<preference-toggle
				class="show-merc-names-in-teams-link"
				*ngIf="showMercNamesInTeamsLink$ | async"
				field="mercenariesShowMercNamesInTeams"
				label="Show names"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesFiltersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showHiddenTeamsLink$: Observable<boolean>;
	showMercNamesInTeamsLink$: Observable<boolean>;

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
				map(
					([currentView, hiddenTeamIds]) =>
						currentView === 'mercenaries-my-teams' && hiddenTeamIds.length > 0,
				),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((info) => cdLog('emitting hidden team ids in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.showMercNamesInTeamsLink$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationMercenaries.selectedCategoryId)
			.pipe(
				filter(([currentView]) => !!currentView),
				map(([currentView]) => currentView === 'mercenaries-compositions-stats'),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				// tap((info) => cdLog('emitting hidden team ids in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.store.send(new MercenariesToggleShowHiddenTeamsEvent(newValue));
	};
}
