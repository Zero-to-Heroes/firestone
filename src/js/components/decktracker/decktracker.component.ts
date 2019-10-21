import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../models/mainwindow/decktracker/decktracker-state';

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
				></decktracker-menu>
				<decktracker-decks [hidden]="state.currentView !== 'decks'" [decks]="state.decks"></decktracker-decks>
				<decktracker-replays
					[hidden]="state.currentView !== 'replays'"
					[replays]="state.replayState"
				></decktracker-replays>
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

	_viewState = 'shown';
}
