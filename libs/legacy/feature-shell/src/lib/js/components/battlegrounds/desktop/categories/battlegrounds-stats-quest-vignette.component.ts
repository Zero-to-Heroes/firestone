import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BgsQuestStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';

@Component({
	selector: 'battlegrounds-stats-quest-vignette',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-stats-quest-vignette.component.scss`,
	],
	template: `
		<div class="battlegrounds-stats-hero-vignette" [ngClass]="{ unused: gamesPlayed === 0 }" tabindex="0">
			<div class="hero-name">{{ name }}</div>
			<div aria-hidden="true" class="portrait-container">
				<img class="icon" [src]="icon" [cardTooltip]="cardId" />
			</div>
			<div class="stats">
				<div class="item average-position">
					<div class="label" [owTranslate]="'app.battlegrounds.personal-stats.hero.average-position'"></div>
					<div class="value">{{ buildValue(averagePosition) }}</div>
				</div>
				<div class="item games-played">
					<div class="label" [owTranslate]="'app.battlegrounds.personal-stats.hero.games-played'"></div>
					<div class="value">{{ gamesPlayed }}</div>
				</div>
				<div
					class="item mmr"
					[ngClass]="{
						positive: netMmr > 0,
						negative: netMmr < 0,
						missing: buildValue(netMmr) === '-'
					}"
				>
					<div
						class="label"
						[owTranslate]="'app.battlegrounds.personal-stats.hero.net-mmr'"
						[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | owTranslate"
					></div>
					<div class="value">{{ buildValue(netMmr) }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsStatsQuestVignetteComponent {
	_stat: BgsQuestStat;
	cardId: string;
	name: string;
	averagePosition: number;
	gamesPlayed: number;
	netMmr: number;
	icon: string;

	@Input() set stat(value: BgsQuestStat) {
		if (!value) {
			return;
		}
		this._stat = value;
		this.cardId = value.id;
		this.name = value.name;
		this.averagePosition = value.playerAveragePosition;
		this.gamesPlayed = value.playerDataPoints;
		this.netMmr = value.playerAverageMmr;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.id}.jpg`;
	}

	constructor(private readonly ow: OverwolfService) {}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return !value ? '-' : value.toFixed(2);
	}
}
