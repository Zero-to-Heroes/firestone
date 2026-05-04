import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameEvent } from '@firestone/game-state';
import { MercenariesBattleStateFacadeService } from '@firestone/mercenaries/common';
import { waitForReady } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'mercenaries-team-control-bar',
	styleUrls: [
		`../../../../../css/component/controls/controls.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-control-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<div class="logo" inlineSVG="assets/svg/decktracker_logo.svg"></div>
			<div class="controls">
				<control-bug></control-bug>
				<control-settings [settingsApp]="'mercenaries'" [shouldMoveSettingsWindow]="false"> </control-settings>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamControlBarComponent implements AfterContentInit {
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';

	closeHandler: () => void;

	constructor(
		private readonly mercenariesStoreFacade: MercenariesBattleStateFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesStoreFacade);

		this.closeHandler = () => {
			if (this.side !== 'out-of-combat-player') {
				this.mercenariesStoreFacade.addBattleEvent(
					Object.assign(new GameEvent(), {
						type:
							this.side === 'player'
								? 'MANUAL_TEAM_PLAYER_WIDGET_CLOSE'
								: 'MANUAL_TEAM_OPPONENT_WIDGET_CLOSE',
					} as GameEvent),
				);
			}
		};

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
