import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';

declare let amplitude: any;

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		`../../../../../css/global/reset-styles.scss`,
		'../../../../../css/component/decktracker/overlay/twitch/twitch-bgs-hero-overview.component.scss',
		'../../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<div class="battlegrounds-theme bgs-hero-overview-tooltip">
			<bgs-opponent-overview-big
				[opponent]="_opponent"
				[enableSimulation]="false"
				[maxBoardHeight]="1.5"
				[currentTurn]="currentTurn"
			></bgs-opponent-overview-big>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchBgsHeroOverviewComponent {
	_opponent: BgsPlayer;

	currentTurn: number;

	@Input() set config(value: { player: BgsPlayer; currentTurn: number }) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
