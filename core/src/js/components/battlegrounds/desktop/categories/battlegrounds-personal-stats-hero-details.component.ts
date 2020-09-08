import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-hero-details',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-hero-details">
			<img [src]="icon" class="portrait" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroDetailsComponent implements AfterViewInit {
	_category: BattlegroundsPersonalStatsHeroDetailsCategory;
	_state: MainWindowState;
	icon: string;

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
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
	private updateValues() {
		if (!this._state || !this._category) {
			return;
		}

		const heroStat = this._state.battlegrounds.stats.heroStats.find(stat => stat.id === this._category.heroId);
		console.log('setting stat', this._category.heroId, heroStat, this._state, this._category);
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${heroStat?.id}.png`;
	}
}
