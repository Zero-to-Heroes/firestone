import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';
import { Navigation } from '../../models/mainwindow/navigation';

const ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS = 150;

@Component({
	selector: 'decktracker',
	styleUrls: [`../../../css/component/decktracker/decktracker.component.scss`],
	template: `
		<div class="decktracker">
			<section class="main divider" [@viewState]="_viewState">
				<decktracker-menu
					[displayType]="state.menuDisplayType"
					[currentView]="state.currentView"
					[hidden]="state.isLoading"
				></decktracker-menu>
				<decktracker-filters [state]="state.filters" [hidden]="state.isLoading"></decktracker-filters>
				<decktracker-decks
					[hidden]="state.currentView !== 'decks' || state.isLoading"
					[decks]="state.decks"
				></decktracker-decks>
				<loading-state [hidden]="!state.isLoading"></loading-state>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state(
				'hidden',
				style({
					opacity: 0,
					'pointer-events': 'none',
				}),
			),
			state(
				'shown',
				style({
					opacity: 1,
				}),
			),
			transition('hidden <=> shown', animate(`${ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		]),
	],
})
export class DecktrackerComponent {
	@Input() state: DecktrackerState;
	@Input() navigation: Navigation;

	_viewState = 'shown';
}
