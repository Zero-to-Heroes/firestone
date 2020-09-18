import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BgsHeroStat, BgsHeroTier } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BattlegroundsCategory } from '../../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalHeroesCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-replays-recap',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-replays-recap">
			<div class="title">Last {{ _numberOfReplays }} replays</div>
			<ul class="list">
				<li *ngFor="let replay of replays">
					<replay-info [replay]="replay"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsReplaysRecapComponent implements AfterViewInit {
	_category: BattlegroundsCategory;
	_state: MainWindowState;
	_numberOfReplays: number;

	replays: readonly GameStat[];

	@Input() set numberOfReplays(value: number) {
		if (value === this._numberOfReplays) {
			return;
		}
		this._numberOfReplays = value;
		this.updateValues();
	}

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
		if (!this._state || !this._category || !this._numberOfReplays) {
			return;
		}

		this.replays = this._state.replays.allReplays
			.filter(replay => replay.gameMode === 'battlegrounds')
			.filter(replay => replay.playerRank != null)
			.slice(0, this._numberOfReplays);
	}
}
