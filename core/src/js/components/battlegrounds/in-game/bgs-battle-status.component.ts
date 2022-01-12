import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'bgs-battle-status',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-battle-status.component.scss`,
	],
	template: `
		<div class="battle-simulation">
			<div
				class="warning"
				inlineSVG="assets/svg/attention.svg"
				*ngIf="_simulationMessage"
				[helpTooltip]="_simulationMessage"
			></div>
			<div class="probas">
				<div class="title" [owTranslate]="'battlegrounds.battle.chance-label'"></div>
				<div class="proba-items">
					<div class="win item">
						<div
							class="label"
							[helpTooltip]="'battlegrounds.battle.win-chance-tooltip' | owTranslate"
							[owTranslate]="'battlegrounds.battle.win-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultWin || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('win') && showReplayLink"
								(click)="viewSimulationResult('win')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | owTranslate"
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
							[helpTooltip]="'battlegrounds.battle.tie-chance-tooltip' | owTranslate"
							[owTranslate]="'battlegrounds.battle.tie-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultTie || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('tie') && showReplayLink"
								(click)="viewSimulationResult('tie')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | owTranslate"
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
							[helpTooltip]="'battlegrounds.battle.lose-chance-tooltip' | owTranslate"
							[owTranslate]="'battlegrounds.battle.lose-chance-label'"
						></div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultLose || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('loss') && showReplayLink"
								(click)="viewSimulationResult('loss')"
								[helpTooltip]="'battlegrounds.battle.sim-sample-link-tooltip' | owTranslate"
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
				<div class="title" [owTranslate]="'battlegrounds.battle.damage-title'"></div>
				<div class="damage dealt" [helpTooltip]="'battlegrounds.battle.damage-dealt-tooltip' | owTranslate">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageWon || '--' }}</div>
				</div>
				<div
					class="damage received"
					[helpTooltip]="'battlegrounds.battle.damage-received-tooltip' | owTranslate"
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
				<div class="title" [owTranslate]="'battlegrounds.battle.lethal-title'"></div>
				<div class="damage dealt" [helpTooltip]="'battlegrounds.battle.lethal-dealt-tooltip' | owTranslate">
					<div class="damage-icon" inlineSVG="assets/svg/lethal.svg"></div>
					<div
						class="damage-value"
						[ngClass]="{ 'active': wonLethalChance && battleSimulationWonLethalChance > 0 }"
					>
						{{ wonLethalChance || '--' }}
					</div>
				</div>
				<div
					class="damage received"
					[helpTooltip]="'battlegrounds.battle.lethal-received-tooltip' | owTranslate"
				>
					<div class="damage-icon" inlineSVG="assets/svg/lethal.svg"></div>
					<div
						class="damage-value"
						[ngClass]="{ 'active': lostLethalChance && battleSimulationLostLethalChance > 0 }"
					>
						{{ lostLethalChance || '--' }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleStatusComponent {
	@Input() showReplayLink: boolean;

	_simulationMessage: string;
	battleSimulationResultWin: string;
	battleSimulationResultTie: string;
	battleSimulationResultLose: string;
	winSimulationSample: readonly GameSample[];
	tieSimulationSample: readonly GameSample[];
	loseSimulationSample: readonly GameSample[];
	temporaryBattleTooltip: string;
	damageWon: string;
	damageLost: string;
	wonLethalChance: string;
	lostLethalChance: string;

	battleSimulationWonLethalChance: number;
	battleSimulationLostLethalChance: number;

	processingSimulationSample: boolean;

	private battle: BgsFaceOffWithSimulation;
	private tempInterval;

	@Input() set nextBattle(value: BgsFaceOffWithSimulation) {
		if (value === this.battle) {
			return;
		}
		this.battle = value;
		this.updateInfo();
	}

	private updateInfo() {
		if (this.tempInterval) {
			clearInterval(this.tempInterval);
		}

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
			case 'secret':
				this._simulationMessage = this.i18n.translateString(
					'battlegrounds.battle.composition-not-supported.general',
					{
						value: this.i18n.translateString(
							'battlegrounds.battle.composition-not-supported.reason-secret',
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
				this._simulationMessage = undefined;
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
		} else if (this.battle?.battleInfoStatus === 'waiting-for-result') {
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.battleSimulationResultWin = '__';
			this.battleSimulationResultTie = '__';
			this.battleSimulationResultLose = '__';
			this.damageWon = '__';
			this.damageLost = '__';
			this.battleSimulationWonLethalChance = null;
			this.battleSimulationLostLethalChance = null;
		} else {
			this.temporaryBattleTooltip =
				'Please be aware that the simulation assumes that the opponent uses their hero power, if it is an active hero power';
		}

		if (this.battle?.battleResult?.wonPercent != null && this.battle?.battleInfoStatus !== 'empty') {
			this.battleSimulationResultWin = this.battle.battleResult.wonPercent.toFixed(1) + '%';
			this.battleSimulationResultTie = this.battle.battleResult.tiedPercent.toFixed(1) + '%';
			this.battleSimulationResultLose = this.battle.battleResult.lostPercent.toFixed(1) + '%';
			this.winSimulationSample = this.battle.battleResult.outcomeSamples?.won;
			this.tieSimulationSample = this.battle.battleResult.outcomeSamples?.tied;
			this.loseSimulationSample = this.battle.battleResult.outcomeSamples?.lost;
			this.damageWon =
				this.battle.battleResult.averageDamageWon != null
					? this.battle.battleResult.averageDamageWon.toFixed(1)
					: '--';
			this.damageLost = this.battle.battleResult.averageDamageLost
				? this.battle.battleResult.averageDamageLost.toFixed(1)
				: '--';
			// If we have no chance of winning / losing the battle, showcasing the lethal chance
			// makes no sense
			this.battleSimulationWonLethalChance = this.battle.battleResult.wonLethalPercent;
			this.battleSimulationLostLethalChance = this.battle.battleResult.lostLethalPercent;

			// 	'lethal chances',
			// 	this.battleSimulationWonLethalChance,
			// 	this.battleSimulationLostLethalChance,
			// 	this.battle,
			// );
			this.wonLethalChance = this.battle.battleResult.wonPercent
				? this.battle.battleResult.wonLethalPercent?.toFixed(1) + '%'
				: null;
			this.lostLethalChance = this.battle.battleResult.lostPercent
				? this.battle.battleResult.lostLethalPercent?.toFixed(1) + '%'
				: null;
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		@Optional() private readonly ow: OverwolfService,
		private readonly bgsSim: BgsBattleSimulationService,
	) {}

	async viewSimulationResult(category: 'win' | 'tie' | 'loss') {
		const simulationSample: GameSample = this.pickSimulationResult(category);

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
			try {
				if (amplitude) {
					amplitude.getInstance().logEvent('bgsSimulation', {
						'bgsSimulationId': id,
					});
				}
			} catch (e) {}
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
