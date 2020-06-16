import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattleResult } from './battle-result';

declare let amplitude: any;

@Component({
	selector: 'bgs-battle-status',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-battle-status.component.scss`,
	],
	template: `
		<div class="battle-simulation">
			<div class="win item">
				<div
					class="label"
					helpTooltip="Your chances of winning the current battle (assumes all hero powers are active)"
				>
					Win
				</div>
				<div class="value">
					{{ battleSimulationResultWin }}
				</div>
				<div class="damage" helpTooltip="Average damage dealt">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#sword" />
						</svg>
					</div>
					<div class="damage-value">{{ damageWon || '--' }}</div>
				</div>
			</div>
			<div class="tie item">
				<div
					class="label"
					helpTooltip="Your chances of tying the current battle (assumes all hero powers are active)"
				>
					Tie
				</div>
				<div class="value">
					{{ battleSimulationResultTie }}
				</div>
			</div>
			<div class="lose item">
				<div
					class="label"
					helpTooltip="Your chances of losing the current battle (assumes all hero powers are active)"
				>
					Loss
				</div>
				<div class="value">
					{{ battleSimulationResultLose }}
				</div>
				<div class="damage" helpTooltip="Average damage received">
					<div class="damage-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#sword" />
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
	battleSimulationResultWin: string;
	battleSimulationResultTie: string;
	battleSimulationResultLose: string;
	temporaryBattleTooltip: string;
	damageWon: string;
	damageLost: string;

	private _previousStatus: string;
	private _previousBattle;
	private tempInterval;

	@Input() set battleSimulationStatus(value: 'empty' | 'waiting-for-result' | 'done') {
		// console.log('setting battle sim status', value, this._previousStatus);
		if (value === this._previousStatus) {
			return;
		}
		this._previousStatus = value;
		if (this.tempInterval) {
			clearInterval(this.tempInterval);
		}
		if (!value || value === 'empty') {
			// console.log('result empty', value);
			this.temporaryBattleTooltip = "Battle simulation will start once we see the opponent's board";
			this.battleSimulationResultWin = '--';
			this.battleSimulationResultTie = '--';
			this.battleSimulationResultLose = '--';
			this.damageWon = null;
			this.damageLost = null;
		} else if (value === 'waiting-for-result') {
			// console.log('result waiting', value);
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.tempInterval = setInterval(() => {
				this.battleSimulationResultWin = (99 * Math.random()).toFixed(1) + '%';
				this.battleSimulationResultTie = (99 * Math.random()).toFixed(1) + '%';
				this.battleSimulationResultLose = (99 * Math.random()).toFixed(1) + '%';
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}, 30);
		} else {
			// console.log('result done', value);
			this.temporaryBattleTooltip =
				'Please be aware that the simulation assumes that the opponent uses their hero power, if it is an active hero power';
		}
	}

	@Input() set nextBattle(value: BattleResult) {
		if (value === this._previousBattle) {
			// console.log('not setting next battle', value, this._previousBattle);
			return;
		}
		this._previousBattle = value;
		// console.log('setting next battle', value);
		if (value?.wonPercent != null) {
			this.battleSimulationResultWin = value.wonPercent.toFixed(1) + '%';
			this.battleSimulationResultTie = value.tiedPercent.toFixed(1) + '%';
			this.battleSimulationResultLose = value.lostPercent.toFixed(1) + '%';
			this.damageWon = value.averageDamageWon?.toFixed(1);
			this.damageLost = value.averageDamageLost?.toFixed(1);
		} else {
			console.log('no value in nextbattle', value);
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		// console.log('after battle status init');
	}
}
