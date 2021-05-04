import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BattlegroundsCategory } from '../../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalHeroesCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-tier-list',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-tier-list.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-tier-list">
			<div class="title">Heroes Tier List</div>
			<bgs-hero-tier *ngFor="let tier of tiers || []; trackBy: trackByTierFn" [tier]="tier"></bgs-hero-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTierListComponent implements AfterViewInit {
	_category: BattlegroundsCategory;
	_state: MainWindowState;
	tiers: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }[] = [];

	stats: readonly BgsHeroStat[];

	@Input() set category(value: BattlegroundsPersonalHeroesCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackByTierFn(index, item: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }) {
		return item.tier;
	}

	private updateValues() {
		// console.log('tier updating values', this._state, this._category);
		if (!this._state?.battlegrounds?.stats?.heroStats || !this._category) {
			return;
		}
		this.stats = this._state?.battlegrounds.stats.heroStats.filter((stat) => stat.id !== 'average');
		const allOverviews = this._state?.battlegrounds.stats.heroStats.filter((overview) => overview.id !== 'average');
		const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
		const groupedByTier: BgsHeroStat[][] = Object.values(groupingByTier(allOverviews));
		this.tiers = [
			{
				tier: 'S' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'S'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'A' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'A'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'B' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'B'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'C' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'C'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'D' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'D'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
		].filter((tier) => tier.heroes);
		// console.log('tier list', this.stats, allOverviews, groupedByTier, this.tiers);
	}
}
