/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { SimpleBarChartData } from '@firestone/shared/common/view';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DuelsMetaStats } from './duels-meta-stats-tier';

@Component({
	selector: 'duels-meta-stats-tier-card-info',
	styleUrls: [`./duels-meta-stats-view-columns.scss`, `./duels-meta-stats-tier-card-info.component.scss`],
	template: `
		<div class="info" [ngClass]="{ 'hover-effect': hoverEffect }" (click)="onClick()">
			<div class="portrait">
				<img [src]="icon" class="portrait-icon" [cardTooltip]="cardId" />
				<img [src]="secondaryClassIcon" class="secondary-class-icon" *ngIf="secondaryClassIcon" />
			</div>
			<div class="details">
				<div class="name">{{ heroName }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
					<div
						class="player"
						*ngIf="playerDataPoints"
						[helpTooltip]="'app.battlegrounds.tier-list.player-data-points-tooltip' | fsTranslate"
					>
						(<span class="value">{{ playerDataPoints }}</span
						>)
					</div>
				</div>
			</div>
			<div class="winrate">
				<div class="global">{{ globalWinrate }}</div>
				<div
					class="player"
					*ngIf="playerWinrate"
					[helpTooltip]="'app.duels.tier-list.player-winrate-tooltip' | fsTranslate"
				>
					(<span class="value">{{ playerWinrate }}</span
					>)
				</div>
			</div>
			<div class="placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + cardId"
				></basic-bar-chart-2>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMetaStatsTierCardInfoComponent {
	@Output() statsClicked = new EventEmitter<DuelsMetaStats>();

	@Input() set stat(value: DuelsMetaStats) {
		this._stat = value;
		const card = this.allCards.getCard(value.cardId);
		this.cardId = value.cardId;
		const isNeutralHero =
			value.cardId.startsWith(CardIds.VanndarStormpikeTavernBrawl) ||
			value.cardId.startsWith(CardIds.DrektharTavernBrawl);
		this.secondaryClassIcon =
			isNeutralHero && !!card?.classes?.length
				? `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${card.classes[0].toLowerCase()}.png`
				: null;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;

		this.heroName = card.name;
		this.dataPoints = this.i18n.translateString('app.duels.tier-list.data-points', {
			value: value.globalRunsPlayed.toLocaleString(this.i18n.formatCurrentLocale() as string),
		}) as string;
		this.playerDataPoints = !!value.playerRunsPlayed
			? this.i18n.translateString('app.duels.tier-list.player-data-points', {
					value: value.playerRunsPlayed.toLocaleString(this.i18n.formatCurrentLocale() as string),
			  })
			: null;
		this.globalWinrate = value.globalWinrate.toFixed(2);
		this.playerWinrate = value.playerWinrate?.toFixed(2);

		const globalPlacementChartData: SimpleBarChartData = {
			data: value.placementDistribution.map((p) => ({
				label: '' + p.wins,
				value: p.percentage,
			})),
		};
		this.placementChartData = [globalPlacementChartData];
	}
	@Input() hoverEffect = false;

	cardId: string;
	secondaryClassIcon: string | null;
	icon: string;
	heroName: string;
	dataPoints: string;
	playerDataPoints: string | null;
	globalWinrate: string;
	playerWinrate: string | undefined;
	placementChartData: SimpleBarChartData[];

	_stat: DuelsMetaStats;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	onClick() {
		this.statsClicked.next(this._stat);
	}
}
