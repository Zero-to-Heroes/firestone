import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { DecktrackerViewType } from '../../models/mainwindow/decktracker/decktracker-view.type';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'decktracker',
	styleUrls: [
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
					<div class="content main-content {{ value.currentView }}">
						<global-header *ngIf="value.menuDisplayType === 'breadcrumbs'"></global-header>
						<menu-selection-decktracker class="menu-selection" *ngIf="value.menuDisplayType === 'menu'">
						</menu-selection-decktracker>
						<!-- hidden until proper support for dropdown is added -->
						<decktracker-filters
							aria-hidden="true"
							*ngIf="value.currentView !== 'constructed-deckbuilder'"
						></decktracker-filters>
						<decktracker-decks *ngIf="value.currentView === 'decks'" role="region"></decktracker-decks>
						<decktracker-ladder-stats
							*ngIf="value.currentView === 'ladder-stats'"
						></decktracker-ladder-stats>
						<decktracker-deck-details
							*ngIf="value.currentView === 'deck-details'"
						></decktracker-deck-details>
						<decktracker-rating-graph
							*ngIf="value.currentView === 'ladder-ranking'"
						></decktracker-rating-graph>
						<constructed-deckbuilder
							*ngIf="value.currentView === 'constructed-deckbuilder'"
						></constructed-deckbuilder>
						<constructed-meta-decks
							*ngIf="value.currentView === 'constructed-meta-decks'"
						></constructed-meta-decks>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				*ngIf="!(showAds$ | async) && showSidebar(value.currentView)"
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
export class DecktrackerComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	currentView$: Observable<DecktrackerViewType>;
	menuDisplayType$: Observable<string>;
	loading$: Observable<boolean>;
	showAds$: Observable<boolean>;

	@Input() showAds: boolean;

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
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));
	}

	showSidebar(currentView: DecktrackerViewType): boolean {
		return currentView === 'deck-details' || this.showReplaysRecap(currentView);
	}

	showReplaysRecap(currentView: DecktrackerViewType): boolean {
		return (
			currentView === 'decks' ||
			currentView === 'ladder-stats' ||
			currentView === 'ladder-ranking' ||
			(currentView === 'deck-details' && !this.showAds)
		);
	}
}
