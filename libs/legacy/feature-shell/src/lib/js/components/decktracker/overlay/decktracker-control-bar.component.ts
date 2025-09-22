import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { GameEvent } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'decktracker-control-bar',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		'../../../../css/component/decktracker/overlay/decktracker-control-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<div class="logo" inlineSVG="assets/svg/decktracker_logo.svg"></div>
			<div class="controls">
				<control-bug></control-bug>
				<control-settings
					[settingsApp]="'decktracker'"
					[settingsSection]="settingsSection"
					[shouldMoveSettingsWindow]="false"
				>
				</control-settings>
				<button (mousedown)="minimize()" inlineSVG="assets/svg/control_minimize.svg"></button>
				<control-close [eventProvider]="closeHandler" [askConfirmation]="true"></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerControlBarComponent {
	settingsSection = 'your-deck';

	@Output() onMinimize: EventEmitter<void> = new EventEmitter<void>();

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
