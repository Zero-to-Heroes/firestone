import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div class="app-section decktracker">
			<section class="main divider">
				<with-loading [isLoading]="!_state || loading">
					<div class="content main-content">
						<global-header
							*ngIf="navigation?.navigationDecktracker.menuDisplayType === 'breadcrumbs'"
						></global-header>
						<menu-selection-decktracker
							class="menu-selection"
							*ngxCacheIf="navigation.navigationDecktracker.menuDisplayType === 'menu'"
						>
						</menu-selection-decktracker>
						<decktracker-filters></decktracker-filters>
						<decktracker-decks
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'decks'"
							[decks]="_state?.decks"
						></decktracker-decks>
						<decktracker-ladder-stats
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'ladder-stats'"
							[state]="_state"
						></decktracker-ladder-stats>
						<decktracker-deck-details
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
							[state]="_state"
							[navigation]="navigation"
						></decktracker-deck-details>
						<decktracker-rating-graph
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'ladder-ranking'"
						></decktracker-rating-graph>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				[ngClass]="{
					'second-display': !showAds && navigation.navigationDecktracker.currentView === 'deck-details'
				}"
			>
				<decktracker-deck-recap
					*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
					[state]="_state"
					[navigation]="navigation"
				></decktracker-deck-recap>
				<decktracker-replays-recap
					*ngxCacheIf="showReplaysRecap()"
					[state]="_state"
					[navigation]="navigation"
				></decktracker-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() set state(value: DecktrackerState) {
		if (this._state === value) {
			return;
		}
		this._state = value;
		// this.showAds = this._state?.showAds;
	}

	@Input() showAds: boolean;
	@Input() loading: boolean;
	@Input() navigation: NavigationState;

	_state: DecktrackerState;
	// showAds: boolean;

	showReplaysRecap(): boolean {
		return (
			this.navigation.navigationDecktracker.currentView === 'decks' ||
			this.navigation.navigationDecktracker.currentView === 'ladder-stats' ||
			(this.navigation.navigationDecktracker.currentView === 'deck-details' && !this.showAds)
		);
	}
}
