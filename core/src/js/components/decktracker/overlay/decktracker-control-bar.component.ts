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
					[settingsSection]="settingsSection"
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId"
				>
				</control-settings>
				<button (mousedown)="minimize()">
					<svg class="svg-icon-fill">
						<use
							xmlns:xlink="https://www.w3.org/1999/xlink"
							xlink:href="assets/svg/sprite.svg#window-control_minimize"
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
	settingsSection = 'your-deck';

	@Output() onMinimize: EventEmitter<void> = new EventEmitter<void>();

	@Input() windowId: string;
	@Input() closeEvent: string;
	@Input() set settingsCategory(value: string) {
		if (value === 'opponent') {
			this.settingsSection = 'opponent-deck';
		} else {
			this.settingsSection = 'your-deck';
		}
	}

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
		this.onMinimize.next();
	}
}
