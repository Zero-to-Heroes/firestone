import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { TwitchBgsCurrentBattle } from './twitch-bgs-state';

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
			<div class="battlegrounds-theme simulation-overlay">
				<bgs-battle-status [nextBattle]="nextBattle" [showReplayLink]="false"></bgs-battle-status>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayStandaloneComponent {
	nextBattle: BgsFaceOffWithSimulation;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';
	simulationMessage: string;

	@Output() dragStart = new EventEmitter<void>();
	@Output() dragEnd = new EventEmitter<void>();

	@Input() set bgsState(value: TwitchBgsCurrentBattle) {
		this.nextBattle = BgsFaceOffWithSimulation.create({
			battleResult: value?.battleInfo,
			battleInfoStatus: value?.status,
			battleInfoMesage: null,
		} as BgsFaceOffWithSimulation);
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	startDragging() {
		this.dragStart.next();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		this.dragEnd.next();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
