import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BattlegroundsCategory } from '../../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalHeroesCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { groupByFunction } from '../../../../services/utils';
import { HeroStat } from './hero-stat';

@Component({
	selector: 'battlegrounds-heroes-records-broken',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-heroes-records-broken">
			<div class="title">Best record heroes</div>
			<ul class="list">
				<battlegrounds-hero-records-broken
					*ngFor="let stat of stats || []"
					[stat]="stat"
				></battlegrounds-hero-records-broken>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroesRecordsBrokenComponent implements AfterViewInit {
	_category: BattlegroundsCategory;
	_state: MainWindowState;

	stats: readonly HeroStat[];

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
		const groupingByHero = groupByFunction((stat: BgsBestStat) => stat.heroCardId);
		const validRecords = this._state.stats.bestBgsUserStats.filter((stat) => stat.heroCardId);
		const statsByHero: readonly BgsBestStat[][] = Object.values(groupingByHero(validRecords));
		this.stats = statsByHero
			.filter((stats) => stats.length > 0)
			.map(
				(stats) =>
					({
						heroId: stats[0].heroCardId,
						numberOfRecords: stats.length,
					} as HeroStat),
			)
			.sort((a, b) => b.numberOfRecords - a.numberOfRecords);
	}
}
