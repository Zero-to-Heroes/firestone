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
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';
import { TwitchBgsCurrentBattle } from './twitch-bgs-state';
import { TwitchPreferencesService } from './twitch-preferences.service';

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
			[ngClass]="{ 'hidden': hidden$ | async }"
		>
			<div class="simulation-overlay scalable">
				<bgs-battle-status [nextBattle]="nextBattle$ | async" [showReplayLink]="false"></bgs-battle-status>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayStandaloneComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterContentInit {
	nextBattle$: Observable<BgsFaceOffWithSimulation>;
	hidden$: Observable<boolean>;

	simulationMessage: string;

	@Output() dragStart = new EventEmitter<void>();
	@Output() dragEnd = new EventEmitter<void>();

	@Input() set bgsState(value: TwitchBgsCurrentBattle) {
		this.battleState$$.next(value);
	}

	@Input() set phase(value: 'combat' | 'recruit') {
		this.phase$$.next(value);
	}

	@Input() set hideWhenEmpty(value: boolean) {
		this.hideWhenEmpty$$.next(value);
	}

	private battleState$$ = new BehaviorSubject<TwitchBgsCurrentBattle>(null);
	private phase$$ = new BehaviorSubject<'combat' | 'recruit'>(null);
	private hideWhenEmpty$$ = new BehaviorSubject<boolean>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit(): void {
		super.listenForResize();
		this.nextBattle$ = combineLatest(
			this.prefs.prefs.asObservable(),
			this.battleState$$.asObservable(),
			this.phase$$.asObservable(),
		).pipe(
			this.mapData(([prefs, battleState, phase]) => {
				if (prefs.hideBattleOddsInCombat && phase === 'combat') {
					return null;
				}
				if (prefs.hideBattleOddsInTavern && phase === 'recruit') {
					return null;
				}
				return BgsFaceOffWithSimulation.create({
					battleResult: battleState?.battleInfo,
					battleInfoStatus: battleState?.status,
					battleInfoMesage: null,
				} as BgsFaceOffWithSimulation);
			}),
		);
		this.hidden$ = combineLatest(this.hideWhenEmpty$$.asObservable(), this.nextBattle$).pipe(
			this.mapData(([hideWhenEmpty, nextBattle]) => {
				if (!hideWhenEmpty) {
					return false;
				}
				return !nextBattle || nextBattle?.battleInfoStatus !== 'done';
			}),
		);
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
