import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { ConstructedNavigationService, DecktrackerViewType } from '@firestone/constructed/common';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
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
							scrollable
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
						<constructed-meta-deck-details
							*ngIf="value.currentView === 'constructed-meta-deck-details'"
						></constructed-meta-deck-details>
						<constructed-meta-archetypes
							*ngIf="value.currentView === 'constructed-meta-archetypes'"
						></constructed-meta-archetypes>
						<constructed-meta-archetype-details
							*ngIf="value.currentView === 'constructed-meta-archetype-details'"
						></constructed-meta-archetype-details>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				*ngIf="!(showAds$ | async) && showSidebar(value.currentView)"
				[ngClass]="{
					'second-display': !showAds && value.currentView === 'deck-details',
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
	showAds$: Observable<boolean>;

	@Input() showAds: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ConstructedNavigationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly mainWindowNavigation: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads, this.mainWindowState, this.mainWindowNavigation);

		this.currentView$ = this.nav.currentView$$.pipe(this.mapData((currentView) => currentView));
		this.menuDisplayType$ = this.mainWindowNavigation.navigationState$$.pipe(
			this.mapData((state) => state.navigationDecktracker.menuDisplayType),
		);
		this.loading$ = this.mainWindowState.mainWindowState$$.pipe(
			this.mapData((state) => state.decktracker.isLoading),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
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
