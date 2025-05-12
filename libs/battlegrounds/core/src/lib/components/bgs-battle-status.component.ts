/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	Optional,
	ViewRef,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, Observable } from 'rxjs';
import { BgsBattleSimulationService } from '../services/simulation/bgs-battle-simulation.service';
import { BgsIntermediateResultsSimGuardianService } from '../services/simulation/bgs-intermediate-results-sim-guardian.service';

@Component({
	selector: 'bgs-battle-status',
	styleUrls: [`./bgs-battle-status.component.scss`],
	template: `
		<div class="battle-simulation">
			<div
				class="warning"
				inlineSVG="assets/svg/attention.svg"
				*ngIf="_simulationMessage"
				[helpTooltip]="_simulationMessage"
			></div>
			<div class="probas">
				<div class="title" [fsTranslate]="'battlegrounds.battle.chance-label'"></div>
				<div class="proba-items">
					<div class="win item">
						<div
							class="label"
							[helpTooltip]="'battlegrounds.battle.win-chance-tooltip' | fsTranslate"
							[fsTranslate]="'battlegrounds.battle.win-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultWin || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('win') && !!showReplayLink"
								(click)="viewSimulationResult('win')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | fsTranslate"
							>
								<svg class="svg-icon-fill" *ngIf="!processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#video" />
								</svg>
								<svg class="svg-icon-fill" class="loading-icon" *ngIf="processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#loading_spiral" />
								</svg>
							</div>
						</div>
					</div>
					<div class="tie item">
						<div
							class="label"
							[helpTooltip]="'battlegrounds.battle.tie-chance-tooltip' | fsTranslate"
							[fsTranslate]="'battlegrounds.battle.tie-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultTie || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('tie') && !!showReplayLink"
								(click)="viewSimulationResult('tie')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | fsTranslate"
							>
								<svg class="svg-icon-fill" *ngIf="!processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#video" />
								</svg>
								<svg class="svg-icon-fill" class="loading-icon" *ngIf="processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#loading_spiral" />
								</svg>
							</div>
						</div>
					</div>
					<div class="lose item">
						<div
							class="label"
							[helpTooltip]="'battlegrounds.battle.lose-chance-tooltip' | fsTranslate"
							[fsTranslate]="'battlegrounds.battle.lose-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultLose || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('loss') && !!showReplayLink"
								(click)="viewSimulationResult('loss')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | fsTranslate"
							>
								<svg class="svg-icon-fill" *ngIf="!processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#video" />
								</svg>
								<svg class="svg-icon-fill" class="loading-icon" *ngIf="processingSimulationSample">
									<use xlink:href="assets/svg/sprite.svg#loading_spiral" />
								</svg>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="damage-container">
				<div class="title" [fsTranslate]="'battlegrounds.battle.damage-title'"></div>
				<div class="damage dealt" [helpTooltip]="damageDealtTooltip">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageWon || '--' }}</div>
				</div>
				<div
					class="damage received"
					[helpTooltip]="'battlegrounds.battle.damage-received-tooltip' | fsTranslate"
				>
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageLost || '--' }}</div>
				</div>
			</div>
			<div class="damage-container lethal">
				<div class="title" [fsTranslate]="'battlegrounds.battle.lethal-title'"></div>
				<div class="damage dealt" [helpTooltip]="'battlegrounds.battle.lethal-dealt-tooltip' | fsTranslate">
					<div class="damage-icon" inlineSVG="assets/svg/lethal.svg"></div>
					<div
						class="damage-value"
						[ngClass]="{
							active:
								wonLethalChance &&
								!!battleSimulationWonLethalChance &&
								battleSimulationWonLethalChance > 0
						}"
					>
						{{ wonLethalChance || '--' }}
					</div>
				</div>
				<div
					class="damage received"
					[helpTooltip]="'battlegrounds.battle.lethal-received-tooltip' | fsTranslate"
				>
					<div class="damage-icon" inlineSVG="assets/svg/lethal.svg"></div>
					<div
						class="damage-value"
						[ngClass]="{
							active:
								lostLethalChance &&
								!!battleSimulationLostLethalChance &&
								battleSimulationLostLethalChance > 0
						}"
					>
						{{ lostLethalChance || '--' }}
					</div>
				</div>
			</div>
		</div>
		<!-- <battle-status-premium
			class="ongoing premium"
			*ngIf="
				!forceHidePremiumBanner &&
				battle?.battleInfoStatus === 'waiting-for-result' &&
				(showPremiumBanner$ | async)
			"
		></battle-status-premium> -->
		<div class="ongoing" *ngIf="isOngoing">
			<svg class="svg-icon-fill loading-icon">
				<use xlink:href="assets/svg/sprite.svg#loading_spiral" />
			</svg>
			<div
				class="text"
				[fsTranslate]="'battlegrounds.battle.temp-result-text'"
				[helpTooltip]="'battlegrounds.battle.temp-result-tooltip'"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleStatusComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showPremiumBanner$: Observable<boolean | null>;

	@Input() showReplayLink: boolean | null;
	@Input() forceHidePremiumBanner: boolean | null;

	@Input() set nextBattle(value: BgsFaceOffWithSimulation | null) {
		if (value === this.battle) {
			return;
		}
		this.battle = value;
		this.updateInfo();
	}

	_simulationMessage: string | null;
	battleSimulationResultWin: string;
	battleSimulationResultTie: string;
	battleSimulationResultLose: string;
	winSimulationSample: readonly GameSample[] | undefined;
	tieSimulationSample: readonly GameSample[] | undefined;
	loseSimulationSample: readonly GameSample[] | undefined;
	temporaryBattleTooltip: string;
	damageWon: string | null;
	damageLost: string | null;
	wonLethalChance: string | null;
	lostLethalChance: string | null;

	battleSimulationWonLethalChance: number | null;
	battleSimulationLostLethalChance: number | null;

	processingSimulationSample: boolean;
	isOngoing: boolean;

	battle: BgsFaceOffWithSimulation | null;

	damageDealtTooltip = this.i18n.translateString('battlegrounds.battle.damage-dealt-tooltip', {
		value: 80,
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		@Optional() private readonly ow: OverwolfService,
		private readonly bgsSim: BgsBattleSimulationService,
		private readonly allCards: CardsFacadeService,
		private readonly guardian: BgsIntermediateResultsSimGuardianService,
		private readonly prefs: PreferencesService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.guardian, this.ads, this.prefs);

		this.showPremiumBanner$ = combineLatest([
			this.ads.hasPremiumSub$$,
			this.guardian.freeUsesLeft$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsSimShowIntermediaryResults)),
		]).pipe(
			debounceTime(200),
			this.mapData(
				([hasPremiumSub, freeUsesLeft, requestIntermediateResults]) =>
					requestIntermediateResults && (!hasPremiumSub || freeUsesLeft === 0),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		switch (this.battle?.battleInfoMesage) {
			case 'scallywag':
				this._simulationMessage = this.i18n.translateString(
					'battlegrounds.battle.composition-not-supported.general',
					{
						value: this.i18n.translateString(
							'battlegrounds.battle.composition-not-supported.reason-pirate',
						),
					},
				);
				break;
			case 'stitched':
				this._simulationMessage = this.i18n.translateString(
					'battlegrounds.battle.composition-not-supported.general',
					{
						value: this.i18n.translateString(
							'battlegrounds.battle.composition-not-supported.reason-stitched',
						),
					},
				);
				break;
			case 'zilliax-enchantment':
				this._simulationMessage = this.i18n.translateString(
					'battlegrounds.battle.composition-not-supported.general',
					{
						value: this.i18n.translateString(
							'battlegrounds.battle.composition-not-supported.reason-enchantment',
							{
								cardName: this.allCards.getCard(CardIds.ZilliaxAssembled_BG29_100_G).name,
							},
						),
					},
				);
				break;
			case 'error':
				this._simulationMessage = this.i18n.translateString(
					'battlegrounds.battle.composition-not-supported.bug',
				);
				break;
			default:
				this._simulationMessage = null;
				break;
		}

		if (!this.battle?.battleInfoStatus || this.battle?.battleInfoStatus === 'empty') {
			this.temporaryBattleTooltip = "Battle simulation will start once we see the opponent's board";
			this.battleSimulationResultWin = '--';
			this.battleSimulationResultTie = '--';
			this.battleSimulationResultLose = '--';
			this.winSimulationSample = [];
			this.tieSimulationSample = [];
			this.loseSimulationSample = [];
			this.damageWon = null;
			this.damageLost = null;
			this.wonLethalChance = null;
			this.lostLethalChance = null;
			// console.log('[bgs-battle-status] no battle info status');
		} else if (
			this.battle?.battleInfoStatus === 'waiting-for-result' ||
			this.battle?.battleInfoStatus === 'ongoing'
		) {
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.battleSimulationResultWin = '__';
			this.battleSimulationResultTie = '__';
			this.battleSimulationResultLose = '__';
			this.damageWon = '__';
			this.damageLost = '__';
			this.battleSimulationWonLethalChance = null;
			this.battleSimulationLostLethalChance = null;
			// console.log('[bgs-battle-status] computing battle status');
		} else {
			this.temporaryBattleTooltip =
				'Please be aware that the simulation assumes that the opponent uses their hero power, if it is an active hero power';
		}

		this.isOngoing = this.battle?.battleInfoStatus === 'ongoing';
		// this.isOngoing = true;
		if (this.battle?.battleResult?.wonPercent != null && this.battle?.battleInfoStatus !== 'empty') {
			// console.log('[bgs-battle-status] received battle status', {
			// 	...(this.battle.battleResult ?? {}),
			// 	damageLosts: undefined,
			// 	damageWons: undefined,
			// });
			this.battleSimulationResultWin = this.battle.battleResult.wonPercent.toFixed(1) + '%';
			this.battleSimulationResultTie = this.battle.battleResult.tiedPercent.toFixed(1) + '%';
			this.battleSimulationResultLose = this.battle.battleResult.lostPercent.toFixed(1) + '%';
			this.damageWon = this.visualizeDamageRange(
				this.battle.battleResult.damageWonRange,
				this.battle.battleResult.averageDamageWon,
			);
			this.damageLost = this.visualizeDamageRange(
				this.battle.battleResult.damageLostRange,
				this.battle.battleResult.averageDamageLost,
			);
			// If we have no chance of winning / losing the battle, showcasing the lethal chance
			// makes no sense
			this.battleSimulationWonLethalChance = this.battle.battleResult.wonLethalPercent;
			this.battleSimulationLostLethalChance = this.battle.battleResult.lostLethalPercent;

			this.wonLethalChance = this.battle.battleResult.wonPercent
				? this.battle.battleResult.wonLethalPercent?.toFixed(1) + '%'
				: null;
			this.lostLethalChance = this.battle.battleResult.lostPercent
				? this.battle.battleResult.lostLethalPercent?.toFixed(1) + '%'
				: null;

			this.winSimulationSample = this.battle.battleResult.outcomeSamples?.won;
			this.tieSimulationSample = this.battle.battleResult.outcomeSamples?.tied;
			this.loseSimulationSample = this.battle.battleResult.outcomeSamples?.lost;
		}
	}

	async viewSimulationResult(category: 'win' | 'tie' | 'loss') {
		const simulationSample: GameSample | null = this.pickSimulationResult(category);

		if (!simulationSample) {
			return;
		}
		this.processingSimulationSample = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const id = this.ow?.isOwEnabled()
			? await this.bgsSim.getIdForSimulationSample(simulationSample)
			: await this.bgsSim.getIdForSimulationSampleWithFetch(simulationSample);
		if (id) {
			if (this.ow?.isOwEnabled()) {
				// Using window.open sometimes doesn't work?
				this.ow.openUrlInDefaultBrowser(`https://replays.firestoneapp.com/?bgsSimulationId=${id}`);
			} else {
				window.open(`https://replays.firestoneapp.com/?bgsSimulationId=${id}`, '_blank');
			}
		}
		this.processingSimulationSample = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	hasSimulationResult(category: 'win' | 'tie' | 'loss') {
		// return true;
		switch (category) {
			case 'win':
				return this.winSimulationSample && this.winSimulationSample.length > 0;
			case 'tie':
				return this.tieSimulationSample && this.tieSimulationSample.length > 0;
			case 'loss':
				return this.loseSimulationSample && this.loseSimulationSample.length > 0;
		}
	}

	private visualizeDamageRange(range: { min: number; max: number }, averageDamage: number): string {
		if (range == null) {
			return '--';
		}

		const format = (value: number) => (value > 10 ? value.toFixed(0) : value.toFixed(0));

		return `${averageDamage.toFixed(1)} (${format(range.min)} - ${format(range.max)})`;
	}

	private pickSimulationResult(category: 'win' | 'tie' | 'loss') {
		switch (category) {
			case 'win':
				return this.winSimulationSample && this.winSimulationSample.length > 0
					? this.winSimulationSample[0]
					: null;
			case 'tie':
				return this.tieSimulationSample && this.tieSimulationSample.length > 0
					? this.tieSimulationSample[0]
					: null;
			case 'loss':
				return this.loseSimulationSample && this.loseSimulationSample.length > 0
					? this.loseSimulationSample[0]
					: null;
		}
	}
}
