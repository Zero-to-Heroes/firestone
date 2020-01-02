import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';
import { Navigation } from '../../models/mainwindow/navigation';

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div class="app-section decktracker">
			<section class="main divider">
				<with-loading [isLoading]="state.isLoading">
					<decktracker-menu
						[displayType]="state.menuDisplayType"
						[currentView]="state.currentView"
					></decktracker-menu>
					<decktracker-filters [state]="state.filters"></decktracker-filters>
					<decktracker-decks
						[hidden]="state.currentView !== 'decks'"
						[decks]="state.decks"
					></decktracker-decks>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() state: DecktrackerState;
	@Input() navigation: Navigation;
}
