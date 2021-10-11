import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'mercenaries-team-control-bar',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/component/controls/controls.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-control-bar.component.scss',
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
					[settingsApp]="'mercenaries'"
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId"
				>
				</control-settings>
				<control-close [windowId]="windowId"></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamControlBarComponent {
	// settingsSection = 'your-deck';

	// @Output() onMinimize: EventEmitter<void> = new EventEmitter<void>();

	@Input() windowId: string;
	// @Input() closeEvent: string;

	// closeHandler: () => void;

	// private deckUpdater: EventEmitter<GameEvent>;

	constructor(private readonly ow: OverwolfService) {
		this.ow.closeWindow(this.windowId);
		// this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		// this.closeHandler = () =>
		// 	this.deckUpdater.next(
		// 		Object.assign(new GameEvent(), {
		// 			type: this.closeEvent,
		// 		} as GameEvent),
		// 	);
	}
}
