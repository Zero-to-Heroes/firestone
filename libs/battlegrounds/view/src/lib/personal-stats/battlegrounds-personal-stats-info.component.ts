/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType, defaultStartingHp, getHeroPower } from '@firestone-hs/reference-data';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsYourStat } from './your-stats.model';

@Component({
	selector: 'battlegrounds-presonal-stats-info',
	styleUrls: [`./battlegrounds-personal-stats-columns.scss`, `./battlegrounds-presonal-stats-info.component.scss`],
	template: `
		<div class="info">
			<bgs-hero-portrait
				aria-hidden="true"
				class="portrait"
				[heroCardId]="heroCardId"
				[cardTooltip]="heroPowerCardId"
				[health]="heroStartingHealth"
			></bgs-hero-portrait>
			<div class="hero-details">
				<div class="name">{{ heroName }}</div>
			</div>
			<div class="position">
				<span class="value">{{ averagePosition }}</span>
			</div>
			<div class="games-played">
				<div class="value">
					{{ gamesPlayed ?? '-' }}
				</div>
			</div>
			<div class="net-mmr">
				<div
					class="value"
					[ngClass]="{
						positive: netMmr > 0,
						negative: netMmr < 0,
						missing: buildValue(netMmr) === '-'
					}"
				>
					{{ buildValue(netMmr) }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsInfoComponent {
	@Input() set stat(value: BattlegroundsYourStat) {
		this.heroCardId = value.cardId;
		this.heroPowerCardId = getHeroPower(value.cardId, this.allCards);
		this.heroName = this.allCards.getCard(value.cardId).name;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.cardId, this.allCards);
		this.gamesPlayed = this.i18n.translateString('app.battlegrounds.tier-list.player-data-points', {
			value: value.totalMatches.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.averagePosition = value.averagePosition.toFixed(2);
		this.netMmr = value.netMmr;
	}

	heroCardId: string;
	heroPowerCardId: string;
	heroName: string;
	heroStartingHealth: number;
	gamesPlayed: string;
	averagePosition: string;
	netMmr: number;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	abs(value: number): number {
		return Math.abs(value);
	}
}
