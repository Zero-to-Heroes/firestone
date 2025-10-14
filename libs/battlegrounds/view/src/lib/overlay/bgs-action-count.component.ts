import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import {
	auditTime,
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	interval,
	map,
	Observable,
	shareReplay,
	startWith,
	switchMap,
	takeUntil,
} from 'rxjs';

interface ActionSample {
	timestamp: number;
	actions: number;
}

@Component({
	standalone: false,
	selector: 'bgs-action-count',
	styleUrls: [`./bgs-action-count.component.scss`],
	template: `
		<div class="action-count scalable">
			<div class="section actions-this-turn">
				<div class="header" [fsTranslate]="'battlegrounds.in-game.action-count.actions-title'"></div>
				<div class="value">{{ actionsThisTurn$ | async }}</div>
			</div>
			<div class="section apm peak-apm" [helpTooltip]="peakApmTooltip">
				<div class="header" [fsTranslate]="'battlegrounds.in-game.action-count.peak-apm-title'"></div>
				<div class="value">
					{{ maxApm | number: '1.1-1' }}
				</div>
			</div>
			<div class="section apm avg-apm" [helpTooltip]="avgApmTooltip">
				<div class="header" [fsTranslate]="'battlegrounds.in-game.action-count.avg-apm-title'"></div>
				<div class="value">
					{{ avgApm | number: '1.1-1' }}
				</div>
			</div>
			<div
				class="close-button"
				inlineSVG="assets/svg/close.svg"
				[helpTooltip]="'battlegrounds.in-game.action-count.close-tooltip' | fsTranslate"
				confirmationTooltip
				[askConfirmation]="true"
				[confirmationText]="'battlegrounds.in-game.action-count.close-confirmation-text' | fsTranslate"
				[validButtonText]="'battlegrounds.in-game.action-count.close-ok' | fsTranslate"
				[cancelButtonText]="'battlegrounds.in-game.action-count.close-cancel' | fsTranslate"
				[switchButtonStyles]="false"
				(onConfirm)="close()"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionCountComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	actionsThisTurn$: Observable<number | null>;
	apm$: Observable<number | null>;
	avgApm: number = 0;
	maxApm: number = 0;

	private actionSamples$ = new BehaviorSubject<ActionSample[]>([]);
	private readonly APM_WINDOW_SECONDS = 4; // Calculate APM over the last N seconds
	private readonly SAMPLE_INTERVAL_MS = 500; // Sample every 500ms

	apmTooltip = this.i18n.translateString('battlegrounds.in-game.action-count.apm-tooltip', {
		value: this.APM_WINDOW_SECONDS,
	});
	avgApmTooltip = this.i18n.translateString('battlegrounds.in-game.action-count.avg-apm-tooltip');
	peakApmTooltip = this.i18n.translateString('battlegrounds.in-game.action-count.peak-apm-tooltip');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady, this.gameState.isReady()]);

		const turnStartTimestamp$ = this.gameState.gameState$$.pipe(
			auditTime(this.SAMPLE_INTERVAL_MS),
			filter((state) => state.bgState?.currentGame?.phase === 'recruit'),
			this.mapData((state) => state?.currentTurn),
			distinctUntilChanged(),
			this.mapData((turn) => new Date().getTime()),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.actionsThisTurn$ = this.gameState.gameState$$.pipe(
			auditTime(this.SAMPLE_INTERVAL_MS),
			filter((state) => state.bgState?.currentGame?.phase === 'recruit'),
			this.mapData((state) => {
				const liveStats = state?.bgState.currentGame?.liveStats;
				const mainPlayer = state?.bgState.currentGame?.getMainPlayer();
				if (!liveStats || !mainPlayer) {
					return null;
				}

				const rerollsThisTurn =
					liveStats.rerollsOverTurn.find((reroll) => reroll.turn === state.currentTurn)?.value ?? 0;
				const buysThisTurn =
					liveStats.minionsBoughtOverTurn.find((buy) => buy.turn === state.currentTurn)?.value ?? 0;
				const sellsThisTurn =
					liveStats.minionsSoldOverTurn.find((sell) => sell.turn === state.currentTurn)?.value ?? 0;
				const minionsThisTurn =
					liveStats.minionsPlayedOverTurn.find((play) => play.turn === state.currentTurn)?.value ?? 0;
				const spellsThisTurn =
					liveStats.spellsPlayedOverTurn.find((spell) => spell.turn === state.currentTurn)?.value ?? 0;
				const discoversThisTurn =
					liveStats.discoversOverTurn.find((spell) => spell.turn === state.currentTurn)?.value ?? 0;
				const upgradesThisTurn = mainPlayer.tavernUpgradeHistory.find(
					(upgrade) => upgrade.turn === state.currentTurn,
				)
					? 1
					: 0;
				const heroPowersThisTurn =
					liveStats.mainPlayerHeroPowersOverTurn.find((power) => power.turn === state.currentTurn)?.value ??
					0;
				const totalActions =
					rerollsThisTurn +
					buysThisTurn +
					sellsThisTurn +
					minionsThisTurn +
					spellsThisTurn +
					upgradesThisTurn +
					discoversThisTurn +
					heroPowersThisTurn;
				return totalActions;
			}),
			startWith(0),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		// Sample actions regularly and store in rolling window
		interval(this.SAMPLE_INTERVAL_MS)
			.pipe(
				switchMap(() => this.actionsThisTurn$),
				map((actions) => {
					const now = Date.now();
					const currentSamples = this.actionSamples$.value;

					// Add new sample
					const newSample: ActionSample = {
						timestamp: now,
						actions: actions,
					};

					// Remove samples older than our window
					const windowStartTime = now - this.APM_WINDOW_SECONDS * 1000;
					const filteredSamples = currentSamples.filter((sample) => sample.timestamp >= windowStartTime);

					// Add the new sample
					const updatedSamples = [...filteredSamples, newSample];

					this.actionSamples$.next(updatedSamples);
					return actions;
				}),
				takeUntil(this.destroyed$),
			)
			.subscribe();

		// Calculate APM from action samples
		this.apm$ = this.actionSamples$.pipe(
			map((samples) => {
				// console.debug('apm', 'samples', samples);
				if (samples.length < 2) {
					return 0; // Need at least 2 samples to calculate rate
				}

				// Sort samples by timestamp (should already be sorted, but just in case)
				const sortedSamples = [...samples].sort((a, b) => a.timestamp - b.timestamp);

				// Calculate the change in actions over the time window
				const oldestSample = sortedSamples[0];
				const newestSample = sortedSamples[sortedSamples.length - 1];

				const actionDiff = newestSample.actions - oldestSample.actions;
				const timeDiffSeconds = (newestSample.timestamp - oldestSample.timestamp) / 1000;

				if (timeDiffSeconds <= 0) {
					return 0;
				}

				// Convert to actions per minute
				const apm = (actionDiff / timeDiffSeconds) * 60;
				return Math.max(0, apm);
			}),
			takeUntil(this.destroyed$),
		);

		interval(this.SAMPLE_INTERVAL_MS)
			.pipe(
				switchMap(() =>
					combineLatest([this.gameState.gameState$$, turnStartTimestamp$, this.actionsThisTurn$]),
				),
				takeUntil(this.destroyed$),
			)
			.subscribe(([state, turnStartTimestamp, actionsThisTurn]) => {
				if (state.bgState?.currentGame?.phase !== 'recruit') {
					return;
				}
				const turnDurationInSeconds = (new Date().getTime() - turnStartTimestamp) / 1000;
				const avgApm = (60 * actionsThisTurn) / turnDurationInSeconds;
				this.avgApm = avgApm;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		this.apm$.pipe(takeUntil(this.destroyed$)).subscribe((apm) => (this.maxApm = Math.max(this.maxApm, apm)));
		turnStartTimestamp$.pipe(takeUntil(this.destroyed$)).subscribe((turnStartTimestamp) => {
			this.maxApm = 0;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async close() {
		this.prefs.updatePrefs('bgsActionCountEnabled', false);
	}
}
