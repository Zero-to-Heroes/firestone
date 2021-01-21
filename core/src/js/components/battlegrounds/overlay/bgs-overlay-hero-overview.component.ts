import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';

declare let amplitude: any;

@Component({
	selector: 'bgs-overlay-hero-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
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
export class BgsOverlayHeroOverviewComponent {
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
