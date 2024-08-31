/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';
import { TwitchBgsCurrentBattle } from '../model/twitch-bgs-state';
import { TwitchPreferencesService } from '../services/twitch-preferences.service';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';

@Component({
	selector: 'bgs-simulation-overlay-standalone',
	styleUrls: [
		`../../../../../legacy/feature-shell/src/lib/css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		`./bgs-simulation-overlay-standalone.component.scss`,
	],
	template: `
		<div
			class="root battlegrounds-theme"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			[ngClass]="{ hidden: hidden$ | async }"
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
	implements AfterContentInit
{
	nextBattle$: Observable<BgsFaceOffWithSimulation | null>;
	hidden$: Observable<boolean | null>;

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

	@Input() set streamerPrefs(value: Partial<Preferences>) {
		this.streamerPrefs$$.next(value);
	}

	private battleState$$ = new BehaviorSubject<TwitchBgsCurrentBattle | null>(null);
	private streamerPrefs$$ = new BehaviorSubject<Partial<Preferences | null>>(null);
	private phase$$ = new BehaviorSubject<'combat' | 'recruit' | null>(null);
	private hideWhenEmpty$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly prefs: TwitchPreferencesService,
		protected override readonly el: ElementRef,
		protected override readonly renderer: Renderer2,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit(): void {
		super.listenForResize();
		this.nextBattle$ = combineLatest([
			this.prefs.prefs.asObservable(),
			this.battleState$$.asObservable(),
			this.phase$$.asObservable(),
			this.streamerPrefs$$.asObservable(),
		]).pipe(
			filter(([prefs, battleState, phase, streamerPrefs]) => !!prefs),
			this.mapData(([prefs, battleState, phase, streamerPrefs]) => {
				const hideBattleOddsInCombat: boolean | undefined =
					prefs!.hideBattleOddsInCombat == null
						? streamerPrefs?.bgsShowSimResultsOnlyOnRecruit
						: prefs!.hideBattleOddsInCombat === 'true';
				const hideBattleOddsInTavern: boolean | undefined =
					prefs!.hideBattleOddsInTavern == null
						? streamerPrefs?.bgsHideSimResultsOnRecruit
						: prefs!.hideBattleOddsInTavern === 'true';
				if (hideBattleOddsInCombat && phase === 'combat') {
					return null;
				}
				if (hideBattleOddsInTavern && phase === 'recruit') {
					return null;
				}
				return BgsFaceOffWithSimulation.create({
					battleResult: battleState?.battleInfo,
					battleInfoStatus: battleState?.status,
					battleInfoMesage: null,
				});
			}),
		);
		this.hidden$ = combineLatest([this.hideWhenEmpty$$.asObservable(), this.nextBattle$]).pipe(
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
