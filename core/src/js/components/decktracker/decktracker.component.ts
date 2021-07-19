import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../models/preferences';

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
							*ngIf="
								navigation.text && navigation?.navigationDecktracker.menuDisplayType === 'breadcrumbs'
							"
						></global-header>
						<menu-selection-decktracker
							class="menu-selection"
							*ngxCacheIf="navigation.navigationDecktracker.menuDisplayType === 'menu'"
							[selectedTab]="navigation.navigationDecktracker.currentView"
						>
						</menu-selection-decktracker>
						<decktracker-filters [state]="_state" [navigation]="navigation"></decktracker-filters>
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
							[prefs]="prefs"
							[navigation]="navigation"
						></decktracker-deck-details>
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
					[prefs]="prefs"
				></decktracker-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() set state(value: DecktrackerState) {
		console.debug('updated state in decktracker');
		if (this._state === value) {
			return;
		}
		this._state = value;
		// this.showAds = this._state?.showAds;
	}

	@Input() showAds: boolean;
	@Input() loading: boolean;
	@Input() navigation: NavigationState;
	@Input() prefs: Preferences;

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
