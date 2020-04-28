import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattleResult } from './battle-result';

declare let amplitude: any;

@Component({
	selector: 'bgs-battle-status',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-battle-status.component.scss`,
	],
	template: `
		<div class="battle-simulation">
			<div class="winning-chance">
				<div class="label">Your chance of winning<span class="tie">(tie)</span></div>
				<div class="value" [helpTooltip]="temporaryBattleTooltip">
					{{ battleSimulationResult }}<span class="tie">({{ battleSimulationResultTie }})</span>
				</div>
			</div>
			<div class="damage">
				<div class="label">Avg damage</div>
				<div class="win" helpTooltip="Expected average damage in case you win the fight">
					{{ damageWon }}
				</div>
				<div class="separation">-</div>
				<div class="lose" helpTooltip="Expected average damage in case you lose the fight">
					{{ damageLost }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleStatusComponent {
	battleSimulationResult: string;
	battleSimulationResultTie: string;
	temporaryBattleTooltip: string;
	damageWon: string;
	damageLost: string;

	private tempInterval;

	@Input() set battleSimulationStatus(value: 'empty' | 'waiting-for-result' | 'done') {
		if (this.tempInterval) {
			clearInterval(this.tempInterval);
		}
		if (!value || value === 'empty') {
			console.log('result empty', value);
			this.temporaryBattleTooltip = "Battle simulation will start once we see the opponent's board";
			this.battleSimulationResult = '--';
			this.battleSimulationResultTie = '--';
		} else if (value === 'waiting-for-result') {
			console.log('result waiting', value);
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.tempInterval = setInterval(() => {
				this.battleSimulationResult = (99 * Math.random()).toFixed(1) + '%';
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}, 30);
		} else {
			console.log('result done', value);
			this.temporaryBattleTooltip =
				'Please be aware that the simulation assumes that the opponent uses their hero power, if it is an active hero power';
		}
	}

	@Input() set nextBattle(value: BattleResult) {
		console.log('setting next battle', value);
		if (value?.wonPercent != null) {
			this.battleSimulationResult = value.wonPercent.toFixed(1) + '%';
			this.battleSimulationResultTie = value.tiedPercent.toFixed(1) + '%';
			this.damageWon = value.averageDamageWon?.toFixed(1);
			this.damageLost = value.averageDamageLost?.toFixed(1);
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
