import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameEvent } from '../../../../models/game-event';
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
export class MercenariesTeamControlBarComponent {
	// settingsSection = 'your-deck';

	// @Output() onMinimize: EventEmitter<void> = new EventEmitter<void>();

	@Input() windowId: string;

	closeHandler: () => void;

	private battleStateUpdater: BehaviorSubject<GameEvent>;

	constructor(private readonly ow: OverwolfService) {
		this.ow.closeWindow(this.windowId);
		this.battleStateUpdater = this.ow.getMainWindow().battleStateUpdater;
		this.closeHandler = () =>
			this.battleStateUpdater.next(
				Object.assign(new GameEvent(), {
					type: 'MANUAL_TEAM_WIDGET_CLOSE',
				} as GameEvent),
			);
	}
}
