import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';

declare let amplitude: any;

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/reset-styles.scss`,
		'../../../../../css/component/decktracker/overlay/twitch/twitch-bgs-hero-overview.component.scss',
		'../../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<div class="logo-container battlegrounds-theme" *ngIf="showLogo">
			<div class="background-main-part"></div>
			<div class="background-second-part"></div>
			<i class="gold-theme logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#logo" />
				</svg>
			</i>
		</div>
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
	showLogo: boolean = true;

	@Input() set config(value: { player: BgsPlayer; currentTurn: number; showLogo: boolean }) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.showLogo = value.showLogo ?? true;
		console.log('set config', value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
