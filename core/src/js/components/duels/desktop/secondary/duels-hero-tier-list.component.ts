import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DuelsHeroPlayerStat } from '../../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../../models/duels/duels-state';
import { OverwolfService } from '../../../../services/overwolf.service';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-hero-tier-list',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-hero-tier-list.component.scss`,
	],
	template: `
		<div class="duels-hero-tier-list">
			<div class="title" helpTooltip="The tiers are computed for your current filters">Tier List</div>
			<duels-tier class="duels-tier" *ngFor="let tier of tiers" [tier]="tier"></duels-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroTierListComponent {
	_state: DuelsState;
	tiers: DuelsTier[] = [];

	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	constructor(private readonly ow: OverwolfService) {}

	private updateValues() {
		if (!this._state) {
			return;
		}
		const stats = this.buildStats();
		if (!stats) {
			return;
		}

		this.tiers = [
			{
				label: 'S',
				tooltip: 'Must pick',
				items: this.filterItems(stats, 60, 101),
			},
			{
				label: 'A',
				tooltip: 'Strong pick',
				items: this.filterItems(stats, 57, 60),
			},
			{
				label: 'B',
				tooltip: 'Good pick',
				items: this.filterItems(stats, 54, 57),
			},
			{
				label: 'C',
				tooltip: 'Fair pick',
				items: this.filterItems(stats, 50, 54),
			},
			{
				label: 'D',
				tooltip: 'Preferably avoid',
				items: this.filterItems(stats, 45, 50),
			},
			{
				label: 'E',
				tooltip: 'Defnitely avoid',
				items: this.filterItems(stats, 0, 45),
			},
		].filter((tier) => tier.items?.length);
	}

	private filterItems(
		stats: readonly DuelsHeroPlayerStat[],
		threshold: number,
		upper: number,
	): readonly DuelsTierItem[] {
		return stats
			.filter((stat) => stat.globalWinrate)
			.filter((stat) => stat.globalWinrate >= threshold && stat.globalWinrate < upper)
			.map((stat) => ({
				cardId: stat.cardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${stat.cardId}.jpg`,
			}));
	}

	private buildStats(): readonly DuelsHeroPlayerStat[] {
		if (!this._state?.playerStats) {
			return;
		}
		switch (this._state.activeStatTypeFilter) {
			case 'hero-power':
				return this._state.playerStats.heroPowerStats;
			case 'signature-treasure':
				return this._state.playerStats.signatureTreasureStats;
			case 'hero':
			default:
				return this._state.playerStats.heroStats;
		}
	}
}
