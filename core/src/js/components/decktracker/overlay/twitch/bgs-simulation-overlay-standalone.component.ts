import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionTwitchComponent } from '@components/decktracker/overlay/twitch/abstract-subscription-twitch.component';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { from } from 'rxjs';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { TwitchBgsCurrentBattle } from './twitch-bgs-state';

@Component({
	selector: 'bgs-simulation-overlay-standalone',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/reset-styles.scss`,
		'../../../../../css/themes/battlegrounds-theme.scss',
		`../../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		`../../../../../css/component/decktracker/overlay/twitch/bgs-simulation-overlay-standalone.component.scss`,
	],
	template: `
		<div
			class="root battlegrounds-theme"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
		>
			<div class="simulation-overlay scalable">
				<bgs-battle-status [nextBattle]="nextBattle" [showReplayLink]="false"></bgs-battle-status>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayStandaloneComponent
	extends AbstractSubscriptionTwitchComponent
	implements AfterContentInit {
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: TwitchPreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		from(this.prefs.prefs.asObservable())
			.pipe(this.mapData((prefs) => prefs?.battleSimScale))
			.subscribe((scale) => {
				// this.el.nativeElement.style.setProperty('--bgs-simulator-scale', scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			});
	}

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
