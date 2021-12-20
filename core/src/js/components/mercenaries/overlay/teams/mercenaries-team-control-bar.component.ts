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
				<control-settings [settingsApp]="'mercenaries'" [shouldMoveSettingsWindow]="false"> </control-settings>
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
	@Input() windowId: string;
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';

	closeHandler: () => void;

	private battleStateUpdater: BehaviorSubject<GameEvent>;

	constructor(private readonly ow: OverwolfService) {
		this.battleStateUpdater = this.ow.getMainWindow().battleStateUpdater;
		this.closeHandler = () => {
			console.debug('performing close', this.windowId, this.side);
			if (this.side !== 'out-of-combat-player') {
				this.battleStateUpdater.next(
					Object.assign(new GameEvent(), {
						type:
							this.side === 'player'
								? 'MANUAL_TEAM_PLAYER_WIDGET_CLOSE'
								: 'MANUAL_TEAM_OPPONENT_WIDGET_CLOSE',
					} as GameEvent),
				);
			} else {
				this.ow.closeWindow(this.windowId);
			}
		};
	}
}
