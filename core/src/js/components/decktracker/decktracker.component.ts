import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div class="app-section decktracker">
			<section class="main divider">
				<with-loading [isLoading]="!state?.decktracker || state?.decktracker.isLoading">
					<div class="content">
						<decktracker-menu
							[displayType]="navigation.navigationDecktracker.menuDisplayType"
							[currentView]="navigation.navigationDecktracker.currentView"
						></decktracker-menu>
						<decktracker-filters [state]="state" [navigation]="navigation"></decktracker-filters>
						<decktracker-decks
							[hidden]="navigation.navigationDecktracker.currentView !== 'decks'"
							[decks]="state?.decktracker?.decks"
						></decktracker-decks>
					</div>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;
}
