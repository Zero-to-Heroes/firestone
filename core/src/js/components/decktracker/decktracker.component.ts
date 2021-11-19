import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';
import { DecktrackerViewType } from '../../models/mainwindow/decktracker/decktracker-view.type';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div
			class="app-section decktracker"
			*ngIf="{ currentView: currentView$ | async, menuDisplayType: menuDisplayType$ | async } as value"
		>
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content">
						<global-header *ngIf="value.menuDisplayType === 'breadcrumbs'"></global-header>
						<menu-selection-decktracker class="menu-selection" *ngIf="value.menuDisplayType === 'menu'">
						</menu-selection-decktracker>
						<decktracker-filters></decktracker-filters>
						<decktracker-decks
							*ngIf="value.currentView === 'decks'"
							[decks]="_state?.decks"
						></decktracker-decks>
						<decktracker-ladder-stats
							*ngIf="value.currentView === 'ladder-stats'"
							[state]="_state"
						></decktracker-ladder-stats>
						<decktracker-deck-details
							*ngIf="value.currentView === 'deck-details'"
							[state]="_state"
							[navigation]="navigation"
						></decktracker-deck-details>
						<decktracker-rating-graph
							*ngIf="value.currentView === 'ladder-ranking'"
						></decktracker-rating-graph>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				[ngClass]="{
					'second-display': !showAds && value.currentView === 'deck-details'
				}"
			>
				<decktracker-deck-recap *ngIf="value.currentView === 'deck-details'"></decktracker-deck-recap>
				<decktracker-replays-recap *ngIf="showReplaysRecap(value.currentView)"></decktracker-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentView$: Observable<DecktrackerViewType>;
	menuDisplayType$: Observable<string>;
	loading$: Observable<boolean>;

	@Input() set state(value: DecktrackerState) {
		if (this._state === value) {
			return;
		}
		this._state = value;
	}

	@Input() showAds: boolean;
	@Input() navigation: NavigationState;

	_state: DecktrackerState;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentView$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDecktracker.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationDecktracker.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.loading$ = this.store
			.listen$(([main, nav, prefs]) => main.decktracker.isLoading)
			.pipe(this.mapData(([isLoading]) => isLoading));
	}

	showReplaysRecap(currentView: DecktrackerViewType): boolean {
		return (
			currentView === 'decks' ||
			currentView === 'ladder-stats' ||
			(currentView === 'deck-details' && !this.showAds)
		);
	}
}
