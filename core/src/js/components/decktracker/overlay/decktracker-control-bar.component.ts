import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { GameEvent } from '../../../models/game-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-control-bar',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/component/controls/controls.scss`,
		'../../../../css/component/decktracker/overlay/decktracker-control-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#decktracker_logo" />
				</svg>
			</i>
			<div class="controls">
				<control-bug></control-bug>
				<control-settings
					[settingsApp]="'decktracker'"
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId"
				>
				</control-settings>
				<button (mousedown)="minimize()">
					<svg class="svg-icon-fill">
						<use
							xmlns:xlink="https://www.w3.org/1999/xlink"
							xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"
						></use>
					</svg>
				</button>
				<control-close
					[windowId]="windowId"
					[eventProvider]="closeHandler"
					[askConfirmation]="true"
				></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerControlBarComponent {
	@Input() windowId: string;
	@Input() closeEvent: string;
	@Output() onMinimize: EventEmitter<void> = new EventEmitter<void>();
	closeHandler: () => void;

	private deckUpdater: EventEmitter<GameEvent>;

	constructor(private readonly ow: OverwolfService) {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.closeHandler = () =>
			this.deckUpdater.next(
				Object.assign(new GameEvent(), {
					type: this.closeEvent,
				} as GameEvent),
			);
	}

	minimize() {
		console.log('minimizing', this.onMinimize);
		this.onMinimize.next();
	}
}
