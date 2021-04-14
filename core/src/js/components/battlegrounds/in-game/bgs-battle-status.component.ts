import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
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
			<div class="message" *ngIf="_simulationMessage">
				{{ _simulationMessage }}
			</div>
			<div class="probas" *ngIf="!_simulationMessage">
				<div class="title">Your chance of:</div>
				<div class="proba-items">
					<div class="win item">
						<div class="label" helpTooltip="Your chances of winning the current battle">
							Win
						</div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultWin || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('win') && showReplayLink"
								(click)="viewSimulationResult('win')"
								helpTooltip="Open a simulation sample leading to this result in your browser"
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
						<div class="label" helpTooltip="Your chances of tying the current battle">
							Tie
						</div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultTie || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('tie') && showReplayLink"
								(click)="viewSimulationResult('tie')"
								helpTooltip="Open a simulation sample leading to this result in your browser"
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
						<div class="label" helpTooltip="Your chances of losing the current battle">
							Loss
						</div>
						<div class="value-container">
							<div class="value">{{ battleSimulationResultLose || '--' }}</div>
							<div
								class="replay-icon"
								*ngIf="hasSimulationResult('loss') && showReplayLink"
								(click)="viewSimulationResult('loss')"
								helpTooltip="Open a simulation sample leading to this result in your browser"
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
			<div class="damage-container" *ngIf="!_simulationMessage">
				<div class="title">Dmg</div>
				<div class="damage dealt" helpTooltip="Average damage dealt">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageWon || '--' }}</div>
				</div>
				<div class="damage received" helpTooltip="Average damage received">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageLost || '--' }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleStatusComponent {
	@Input() showReplayLink: boolean;

	_simulationMessage;
	battleSimulationResultWin: string;
	battleSimulationResultTie: string;
	battleSimulationResultLose: string;
	winSimulationSample: readonly GameSample[];
	tieSimulationSample: readonly GameSample[];
	loseSimulationSample: readonly GameSample[];
	temporaryBattleTooltip: string;
	damageWon: string;
	damageLost: string;

	processingSimulationSample: boolean;

	private _previousStatus: string;
	private _previousBattle;
	private tempInterval;

	@Input() set battleSimulationStatus(value: 'empty' | 'waiting-for-result' | 'done') {
		// console.log('setting battle sim status', value, this._previousStatus);
		if (value === this._previousStatus) {
			return;
		}
		this._previousStatus = value;
		this.updateInfo();
	}

	@Input() set simulationMessage(value: 'not-supported' | undefined) {
		// console.debug('setting simulation message', value);
		switch (value) {
			case 'not-supported':
				this._simulationMessage = `This composition is not supported`;
				break;
			default:
				this._simulationMessage = undefined;
				break;
		}
		// console.debug('set simulation message', this._simulationMessage);
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@Input() set nextBattle(value: SimulationResult) {
		if (value === this._previousBattle) {
			// console.log('not setting next battle', value, this._previousBattle);
			return;
		}
		this._previousBattle = value;
		this.updateInfo();
	}

	private updateInfo() {
		if (this.tempInterval) {
			clearInterval(this.tempInterval);
		}
		if (!this._previousStatus || this._previousStatus === 'empty') {
			// console.log('result empty', value);
			this.temporaryBattleTooltip = "Battle simulation will start once we see the opponent's board";
			this.battleSimulationResultWin = '--';
			this.battleSimulationResultTie = '--';
			this.battleSimulationResultLose = '--';
			this.winSimulationSample = [];
			this.tieSimulationSample = [];
			this.loseSimulationSample = [];
			this.damageWon = null;
			this.damageLost = null;
		} else if (this._previousStatus === 'waiting-for-result') {
			// console.log('result waiting', value);
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.battleSimulationResultWin = '__';
			this.battleSimulationResultTie = '__';
			this.battleSimulationResultLose = '__';
		} else {
			// console.log('result done', value);
			this.temporaryBattleTooltip =
				'Please be aware that the simulation assumes that the opponent uses their hero power, if it is an active hero power';
		}

		// console.log('setting next battle', this._previousBattle, this._previousStatus);
		if (this._previousBattle?.wonPercent != null && this._previousStatus !== 'empty') {
			this.battleSimulationResultWin = this._previousBattle.wonPercent.toFixed(1) + '%';
			this.battleSimulationResultTie = this._previousBattle.tiedPercent.toFixed(1) + '%';
			this.battleSimulationResultLose = this._previousBattle.lostPercent.toFixed(1) + '%';
			this.winSimulationSample = this._previousBattle.outcomeSamples.won;
			this.tieSimulationSample = this._previousBattle.outcomeSamples.tied;
			this.loseSimulationSample = this._previousBattle.outcomeSamples.lost;
			this.damageWon = this._previousBattle.averageDamageWon?.toFixed(1);
			this.damageLost = this._previousBattle.averageDamageLost?.toFixed(1);
		} else {
			// console.log('no value in nextbattle', this._previousBattle, this._previousStatus);
		}
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private readonly bgsSim: BgsBattleSimulationService,
	) {}

	ngAfterViewInit() {
		// console.log('after battle status init');
	}

	async viewSimulationResult(category: 'win' | 'tie' | 'loss') {
		console.log('viewing simulation result', category);
		const simulationSample: GameSample = this.pickSimulationResult(category);
		// console.log('sim sample', simulationSample);
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
		console.log('id', id);
		if (id) {
			// window.open(`http://replays.firestoneapp.com/?bgsSimulationId=${id}`, '_blank');
			if (this.ow?.isOwEnabled()) {
				// Using window.open sometimes doesn't work?
				this.ow.openUrlInDefaultBrowser(`http://replays.firestoneapp.com/?bgsSimulationId=${id}`);
			} else {
				// console.log('window', window);
				window.open(`http://replays.firestoneapp.com/?bgsSimulationId=${id}`, '_blank');
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
