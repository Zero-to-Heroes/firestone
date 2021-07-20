import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { OverwolfService } from '../../../../services/overwolf.service';
import { areDeepEqual } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-stats-hero-vignette',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-stats-hero-vignette" [ngClass]="{ 'unused': gamesPlayed === 0 }">
			<div class="wrapper-for-flip">
				<div class="box-side">
					<div class="hero-name">{{ heroName }}</div>
					<img [src]="icon" class="portrait" />
					<div class="stats">
						<div class="item average-position">
							<div class="label">Average position</div>
							<div class="value">{{ buildValue(averagePosition) }}</div>
						</div>
						<div class="item games-played">
							<div class="label">Games played</div>
							<div class="value">{{ gamesPlayed }}</div>
						</div>
						<div
							class="item mmr"
							[ngClass]="{
								'positive': netMmr > 0,
								'negative': netMmr < 0,
								'missing': buildValue(netMmr) === '-'
							}"
						>
							<div class="label" helpTooltip="Average MMR gain/loss per match">Net MMR</div>
							<div class="value">{{ buildValue(netMmr) }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsStatsHeroVignetteComponent {
	_stat: BgsHeroStat;
	heroName: string;
	icon: string;
	averagePosition: number;
	gamesPlayed: number;
	netMmr: number;

	flip = 'inactive';

	@Input() set stat(value: BgsHeroStat) {
		// TODO perf: this should definitely be done differently
		if (!value || areDeepEqual(value, this._stat)) {
			return;
		}
		// console.debug(
		// 	'setting stats',
		// 	value,
		// 	this._stat,
		// 	JSON.stringify(value),
		// 	JSON.stringify(this._stat),
		// 	JSON.stringify(value) == JSON.stringify(this._stat),
		// );
		this._stat = value;
		this.heroName = value.name;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.id}.png?v=3`;
		this.averagePosition = value.playerAveragePosition;
		this.gamesPlayed = value.playerGamesPlayed;
		this.netMmr = value.playerAverageMmr;
	}

	constructor(private readonly ow: OverwolfService) {}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return !value ? '-' : value.toFixed(2);
	}
}
