import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/reset-styles.scss`,
		'../../../../../css/themes/battlegrounds-theme.scss',
		'../../../../../css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/twitch-bgs-hero-overview.component.scss',
	],
	template: `
		<div class="battlegrounds-theme bgs-hero-overview-tooltip">
			<bgs-opponent-overview-big
				[opponent]="_opponent"
				[enableSimulation]="false"
				[maxBoardHeight]="-1"
				[currentTurn]="currentTurn"
				tavernTitle="Latest upgrade"
				[showTavernsIfEmpty]="false"
			></bgs-opponent-overview-big>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchBgsHeroOverviewComponent {
	_opponent: BgsPlayer;
	currentTurn: number;
	showLogo = true;

	@Input() set config(value: { player: BgsPlayer; currentTurn: number; showLogo: boolean }) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.showLogo = value.showLogo ?? true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
