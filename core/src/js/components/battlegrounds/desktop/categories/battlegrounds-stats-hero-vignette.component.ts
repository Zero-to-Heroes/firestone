import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-stats-hero-vignette',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-stats-hero-vignette" [ngClass]="{ 'unused': gamesPlayed === 0 }">
			<img [src]="icon" class="portrait" (click)="seeDetailedHeroStats()" />
			<div class="stats">
				<div class="item average-position">
					<div class="label">Average position</div>
					<div class="value">{{ buildValue(averagePosition) }}</div>
				</div>
				<div class="item games-played">
					<div class="label">Games played</div>
					<div class="value">{{ gamesPlayed }}</div>
				</div>
				<div class="item mmr" [ngClass]="{ 'positive': netMmr > 0, 'negative': netMmr < 0 }">
					<div class="label" helpTooltip="Average MMR gain/loss per match">Net MMR</div>
					<div class="value">{{ buildValue(netMmr) }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsStatsHeroVignetteComponent implements AfterViewInit {
	_stat: BgsHeroStat;
	icon: string;
	averagePosition: number;
	gamesPlayed: number;
	netMmr: number;

	@Input() set stat(value: BgsHeroStat) {
		// console.log('setting stats', value);
		if (!value) {
			return;
		}
		this._stat = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.id}.png`;
		this.averagePosition = value.playerAveragePosition;
		this.gamesPlayed = value.playerGamesPlayed;
		this.netMmr = value.playerAverageMmr;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null ? 'N/A' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return !value ? 'N/A' : value.toFixed(2);
	}

	seeDetailedHeroStats() {
		// console.log('choosing hero details', this._stat.id);
		this.stateUpdater.next(new BgsPersonalStatsSelectHeroDetailsEvent(this._stat.id));
	}
}
