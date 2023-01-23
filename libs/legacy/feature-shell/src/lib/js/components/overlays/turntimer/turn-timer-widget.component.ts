import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { GameType } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, interval, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TurnTiming } from '../../../models/decktracker/deck-state';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
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
				<div class="total-length">{{ totalMatchLength$ | async | date: 'mm:ss' }}</div>
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
export class TurnTimerWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showTurnTimerMatchLength$: Observable<boolean>;
	currentTurn$: Observable<string>;
	totalMatchLength$: Observable<Date>;
	player$: Observable<TurnTimerPlayer>;
	opponent$: Observable<TurnTimerPlayer>;
	showFuse$: Observable<boolean>;

	opacity$: Observable<number>;
	width$: Observable<number>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.showFuse$ = this.store
			.listenDeckState$((state) => state?.metadata?.gameType)
			.pipe(this.mapData(([gameType]) => ![GameType.GT_VS_AI].includes(gameType)));
		this.currentTurn$ = this.store
			.listenDeckState$((state) => state?.currentTurn)
			.pipe(
				this.mapData(([currentTurn]) =>
					isNaN(+currentTurn)
						? this.i18n.translateString('turn-timer.mulligan')
						: this.i18n.translateString('turn-timer.current-turn', {
								value: currentTurn,
						  }),
				),
			);
		this.totalMatchLength$ = combineLatest(
			interval(1000),
			this.store.listenDeckState$((state) => state?.matchStartTimestamp),
		).pipe(
			filter(([interval, [matchStartTimestamp]]) => !!matchStartTimestamp),
			this.mapData(([interval, [matchStartTimestamp]]) => formatDuration(Date.now() - matchStartTimestamp)),
		);
		this.player$ = combineLatest(
			interval(1000),
			this.store.listenDeckState$(
				(state) => state?.playerDeck?.hero?.playerName,
				(state) => state?.playerDeck?.turnDuration,
				(state) => state?.playerDeck?.turnTimings,
			),
			this.listenForBasicPref$((prefs) => prefs.useStreamerMode),
		).pipe(
			this.mapData(([interval, [playerName, turnDuration, turnTimings], useStreamerMode]) =>
				this.buildPlayer(
					useStreamerMode ? this.i18n.translateString('decktracker.streamer-mode.you') : playerName,
					turnDuration,
					turnTimings,
				),
			),
		);
		this.opponent$ = combineLatest(
			interval(1000),
			this.store.listenDeckState$(
				(state) => state?.opponentDeck?.hero?.playerName,
				(state) => state?.opponentDeck?.turnDuration,
				(state) => state?.opponentDeck?.turnTimings,
			),
			this.listenForBasicPref$((prefs) => prefs.useStreamerMode),
		).pipe(
			this.mapData(([interval, [playerName, turnDuration, turnTimings], useStreamerMode]) =>
				this.buildPlayer(
					useStreamerMode ? this.i18n.translateString('decktracker.streamer-mode.opponent') : playerName,
					turnDuration,
					turnTimings,
				),
			),
		);

		this.opacity$ = this.listenForBasicPref$((prefs) => prefs.turnTimerWidgetOpacity).pipe(
			this.mapData((opacity) => Math.max(0.01, opacity / 100)),
		);
		this.width$ = this.listenForBasicPref$((prefs) => prefs.turnTimerWidgetWidth);
		this.showTurnTimerMatchLength$ = this.listenForBasicPref$((prefs) => prefs.showTurnTimerMatchLength);

		this.store
			.listenPrefs$((prefs) => prefs.turnTimerWidgetScale)
			.pipe(
				filter(([pref]) => !!pref),
				this.mapData(([pref]) => pref),
			)
			.subscribe((scale) => {
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
			});
	}

	closeHandler = () => {
		this.store?.send(new GenericPreferencesUpdateEvent((prefs) => ({ ...prefs, showTurnTimer: false })));
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
