import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { GameStateFacadeService, TurnTiming } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, combineLatest, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { sumOnArray } from '../../../services/utils';

@Component({
	selector: 'turn-timer-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/turntimer/turn-timer-widget.component.scss',
	],
	template: `
		<div class="turn-timer-widget decktracker-theme scalable" [style.width.px]="width$ | async">
			<div class="background" [style.opacity]="opacity$ | async"></div>
			<div class="match-length" *ngIf="showTurnTimerMatchLength$ | async">
				<div class="current-turn">{{ currentTurn$ | async }}</div>
				<div class="total-length">{{ totalMatchLength$ | async | shortDate }}</div>
			</div>
			<div class="players">
				<turn-timer-player class="player" [player]="player$ | async" [showFuse]="showFuse$ | async">
				</turn-timer-player>
				<turn-timer-player
					class="player opponent"
					[player]="opponent$ | async"
					[showFuse]="showFuse$ | async"
				></turn-timer-player>
			</div>

			<control-close class="close-button" [eventProvider]="closeHandler"></control-close>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnTimerWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showTurnTimerMatchLength$: Observable<boolean>;
	currentTurn$: Observable<string>;
	totalMatchLength$: Observable<Date>;
	player$: Observable<TurnTimerPlayer>;
	opponent$: Observable<TurnTimerPlayer>;
	showFuse$: Observable<boolean>;

	opacity$: Observable<number>;
	width$: Observable<number>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly gameState: GameStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.gameState.isReady(), this.prefs.isReady()]);

		this.showFuse$ = this.gameState.gameState$$.pipe(
			this.mapData((state) => ![GameType.GT_VS_AI].includes(state?.metadata?.gameType)),
		);
		this.currentTurn$ = this.gameState.gameState$$.pipe(
			this.mapData((state) =>
				isNaN(+state?.currentTurn)
					? this.i18n.translateString('turn-timer.mulligan')
					: this.i18n.translateString('turn-timer.current-turn', {
							value: state?.currentTurn,
					  }),
			),
		);
		this.totalMatchLength$ = combineLatest([
			interval(1000),
			this.gameState.gameState$$.pipe(this.mapData((state) => state?.matchStartTimestamp)),
		]).pipe(
			filter(([interval, matchStartTimestamp]) => !!matchStartTimestamp),
			this.mapData(([interval, matchStartTimestamp]) => formatDuration(Date.now() - matchStartTimestamp)),
		);
		this.player$ = combineLatest([
			interval(1000),
			this.gameState.gameState$$.pipe(
				this.mapData(
					(state) => ({
						playerName: state?.playerDeck?.hero?.playerName,
						turnDuration: state?.playerDeck?.turnDuration,
						turnTimings: state?.playerDeck?.turnTimings,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.useStreamerMode)),
		]).pipe(
			this.mapData(([interval, { playerName, turnDuration, turnTimings }, useStreamerMode]) =>
				this.buildPlayer(
					useStreamerMode ? this.i18n.translateString('decktracker.streamer-mode.you') : playerName,
					turnDuration,
					turnTimings,
				),
			),
		);
		this.opponent$ = combineLatest([
			interval(1000),
			this.gameState.gameState$$.pipe(
				this.mapData(
					(state) => ({
						playerName: state?.opponentDeck?.hero?.playerName,
						turnDuration: state?.opponentDeck?.turnDuration,
						turnTimings: state?.opponentDeck?.turnTimings,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.useStreamerMode)),
		]).pipe(
			this.mapData(([interval, { playerName, turnDuration, turnTimings }, useStreamerMode]) =>
				this.buildPlayer(
					useStreamerMode ? this.i18n.translateString('decktracker.streamer-mode.opponent') : playerName,
					turnDuration,
					turnTimings,
				),
			),
		);

		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => Math.max(0.01, prefs.turnTimerWidgetOpacity / 100)),
		);
		this.width$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.turnTimerWidgetWidth));
		this.showTurnTimerMatchLength$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.showTurnTimerMatchLength),
		);

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.turnTimerWidgetScale),
				filter((pref) => !!pref),
				this.mapData((pref) => pref),
			)
			.subscribe((scale) => {
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	closeHandler = async () => {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			showTurnTimer: false,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	private buildPlayer(playerName: string, turnDuration: number, turnTimings: readonly TurnTiming[]): TurnTimerPlayer {
		const totalPlayedDurationInMillis = sumOnArray(
			turnTimings,
			(turn) => (turn.endTimestamp ?? Date.now()) - turn.startTimestamp,
		);
		const currentTurnTiming = turnTimings.find((turn) => !turn.endTimestamp);
		const currentTurnDurationInMillis = !!currentTurnTiming ? Date.now() - currentTurnTiming.startTimestamp : null;
		const result = {
			name: playerName,
			currentTurnDurationInMillis: currentTurnDurationInMillis,
			totalPlayedDurationInMillis: totalPlayedDurationInMillis,
			turnDuration: turnDuration,
		};
		return result;
	}
}

@Component({
	selector: 'turn-timer-player',
	styleUrls: ['../../../../css/component/overlays/turntimer/turn-timer-widget.component.scss'],
	template: `
		<div class="player-timer" [ngClass]="{ active: active }">
			<div class="player-name" [helpTooltip]="playerName">{{ playerName }}</div>
			<div class="turn-length current">
				<div
					class="numeric-value"
					*ngIf="currentTurnDuration"
					[helpTooltip]="'turn-timer.player-current-turn-tooltip' | owTranslate"
				>
					{{ currentTurnDuration | date: 'mm:ss' }}
				</div>
				<div class="numeric-value" *ngIf="!currentTurnDuration">-</div>
				<div class="turn-fuse" *ngIf="currentTurnDuration && showFuse">
					<div class="background"></div>
					<div class="fuse" [style.width.%]="fusePercent"></div>
				</div>
			</div>
			<div
				class="turn-length total"
				[helpTooltip]="'turn-timer.player-total-turn-tooltip' | owTranslate"
				*ngIf="totalPlayedDuration"
			>
				{{ totalPlayedDuration | date: 'mm:ss' }}
			</div>
			<div
				class="turn-length total"
				[helpTooltip]="'turn-timer.player-total-turn-tooltip' | owTranslate"
				*ngIf="!totalPlayedDuration"
			>
				-
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnTimerPlayerComponent {
	@Input() set player(value: TurnTimerPlayer) {
		if (!value) {
			return;
		}
		this.playerName = value.name;
		this.currentTurnDuration = formatDuration(value.currentTurnDurationInMillis);
		this.totalPlayedDuration = formatDuration(value.totalPlayedDurationInMillis);
		const turnMaxDuration = value.turnDuration ?? TURN_DURATION_MILLIS;
		this.fusePercent = Math.min(100, (100 * value.currentTurnDurationInMillis) / turnMaxDuration);
		this.active = !!this.currentTurnDuration;
	}

	@Input() showFuse: boolean;

	playerName: string;
	totalPlayedDuration: Date;
	currentTurnDuration: Date;
	fusePercent: number;
	active: boolean;
}

const TURN_DURATION_MILLIS = 75_000;

const formatDuration = (durationInMillis: number): Date => {
	if (!durationInMillis) {
		return null;
	}
	const result = new Date(0, 0, 0);
	result.setMilliseconds(durationInMillis);
	return result;
};

interface TurnTimerPlayer {
	readonly name: string;
	readonly currentTurnDurationInMillis: number;
	readonly totalPlayedDurationInMillis: number;
	readonly turnDuration: number;
}
