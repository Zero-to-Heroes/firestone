import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { TwitchBgsState } from './twitch-bgs-state';

declare let amplitude: any;

@Component({
	selector: 'bgs-simulation-overlay-standalone',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/reset-styles.scss`,
		`../../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		`../../../../../css/component/decktracker/overlay/twitch/bgs-simulation-overlay-standalone.component.scss`,
		'../../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<div
			class="root battlegrounds-theme"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
		>
			<div class="logo-container battlegrounds-theme">
				<div class="background-main-part"></div>
				<div class="background-second-part"></div>
				<i class="gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
					</svg>
				</i>
			</div>
			<div class="battlegrounds-theme simulation-overlay">
				<bgs-battle-status
					[nextBattle]="nextBattle"
					[battleSimulationStatus]="battleSimulationStatus"
					[showReplayLink]="true"
				></bgs-battle-status>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayStandaloneComponent {
	nextBattle: SimulationResult;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';

	@Output() dragStart = new EventEmitter<void>();
	@Output() dragEnd = new EventEmitter<void>();

	@Input() set bgsState(value: TwitchBgsState) {
		this.nextBattle = value?.currentBattle?.battleInfo;
		this.battleSimulationStatus = value?.currentBattle?.status;
		console.log('setting game state', value, this.nextBattle, this.battleSimulationStatus);
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	startDragging() {
		// console.log('starting dragging');
		// this.events.broadcast(Events.HIDE_TOOLTIP);
		this.dragStart.next();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		// console.log('stopped dragging');
		this.dragEnd.next();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
