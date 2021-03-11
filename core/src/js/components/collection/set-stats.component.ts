import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Set } from '../../models/set';
import { dustFor } from '../../services/hs-utils';

@Component({
	selector: 'set-stats',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/set-stats.component.scss`,
	],
	template: `
		<div class="set-stats">
			<!-- TODO: add toggle for golden / basic -->
			<div class="title">Set stats</div>
			<div class="stats">
				<set-stat-cell
					*ngFor="let stat of stats"
					[text]="stat.text"
					[current]="stat.current"
					[total]="stat.total"
				></set-stat-cell>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatsComponent {
	@Input() set set(value: Set) {
		this._set = value;
		this.updateInfos();
	}

	_set: Set;
	stats: readonly Stat[];

	private updateInfos() {
		if (!this._set) {
			return;
		}

		this.stats = [
			{
				text: 'Dust',
				current: this._set.allCards
					.map(card => dustFor(card.rarity) * card.getNumberCollected())
					.reduce((a, b) => a + b, 0),
				total: this._set.allCards
					.map(card => dustFor(card.rarity) * card.getMaxCollectible())
					.reduce((a, b) => a + b, 0),
			},
			{
				text: 'Common',
				current: this.getOwned('common'),
				total: this.getTotal('common'),
			},
			{
				text: 'Rare',
				current: this.getOwned('rare'),
				total: this.getTotal('rare'),
			},
			{
				text: 'Epic',
				current: this.getOwned('epic'),
				total: this.getTotal('epic'),
			},
			{
				text: 'Legendary',
				current: this.getOwned('legendary'),
				total: this.getTotal('legendary'),
			},
		];

		// this.totalDustGolden = this._set.allCards
		// 	.map(card => dustForPremium(card.rarity) * card.getMaxCollectible())
		// 	.reduce((a, b) => a + b, 0);
		// this.completedDustGolden = this._set.allCards
		// 	.map(card => dustForPremium(card.rarity) * card.getNumberCollectedPremium())
		// 	.reduce((a, b) => a + b, 0);
	}

	private getOwned(rarity: 'common' | 'rare' | 'epic' | 'legendary'): number {
		return this._set.allCards
			.filter(card => card.rarity === rarity)
			.map(card => card.getNumberCollected())
			.reduce((a, b) => a + b, 0);
	}

	private getTotal(rarity: 'common' | 'rare' | 'epic' | 'legendary'): number {
		return this._set.allCards
			.filter(card => card.rarity === rarity)
			.map(card => card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
	}
}

interface Stat {
	readonly text: string;
	readonly current: number;
	readonly total: number;
}
