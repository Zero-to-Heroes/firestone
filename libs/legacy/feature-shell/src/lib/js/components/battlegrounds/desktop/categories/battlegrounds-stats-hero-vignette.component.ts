import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { defaultStartingHp } from '../../../../services/hs-utils';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-stats-hero-vignette',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component.scss`,
	],
	template: `
		<div class="battlegrounds-stats-hero-vignette" [ngClass]="{ unused: gamesPlayed === 0 }" tabindex="0">
			<div class="wrapper-for-flip">
				<div class="box-side">
					<div class="hero-name">{{ heroName }}</div>
					<bgs-hero-portrait
						aria-hidden="true"
						class="portrait"
						[heroCardId]="heroCardId"
						[health]="heroStartingHealth"
					></bgs-hero-portrait>
					<!-- <img [src]="icon" class="portrait" /> -->
					<div class="stats">
						<div class="item average-position">
							<div
								class="label"
								[owTranslate]="'app.battlegrounds.personal-stats.hero.average-position'"
							></div>
							<div class="value">{{ buildValue(averagePosition) }}</div>
						</div>
						<div class="item games-played">
							<div
								class="label"
								[owTranslate]="'app.battlegrounds.personal-stats.hero.games-played'"
							></div>
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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsStatsHeroVignetteComponent {
	_stat: BgsHeroStat;
	heroName: string;
	// icon: string;
	heroCardId: string;
	heroStartingHealth: number;
	averagePosition: number;
	gamesPlayed: number;
	netMmr: number;

	flip = 'inactive';

	@Input() set stat(value: BgsHeroStat) {
		if (!value) {
			return;
		}
		this._stat = value;
		this.heroName = value.name;
		this.heroCardId = value.id;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id);
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
