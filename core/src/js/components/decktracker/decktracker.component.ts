import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
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
				<with-loading [isLoading]="!state?.decktracker || state?.decktracker.isLoading">
					<div class="content">
						<global-header
							[navigation]="navigation"
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
						<decktracker-filters [state]="state" [navigation]="navigation"></decktracker-filters>
						<decktracker-decks
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'decks'"
							[decks]="state?.decktracker?.decks"
						></decktracker-decks>
						<decktracker-deck-details
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
							[state]="state"
							[navigation]="navigation"
						></decktracker-deck-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<decktracker-deck-recap
					*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
					[state]="state"
					[navigation]="navigation"
				></decktracker-deck-recap>
				<decktracker-replays-recap
					*ngxCacheIf="navigation.navigationDecktracker.currentView === 'decks'"
					[state]="state"
				></decktracker-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;
}
