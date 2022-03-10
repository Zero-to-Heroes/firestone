import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SimpleBarChartData } from '@components/common/chart/simple-bar-chart-data';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'duels-hero-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-hero-info.component.scss',
	],
	template: `
		<div class="hero-info">
			<div class="bio">
				<img [src]="heroPortrait" class="portrait" />
				<!-- 
					Info to add:
					- top decks available with current dust filters (and also filter out unavailable hero powers and treasures?) (or at least gray them out?)

				 -->
				<div class="bio-info">
					<div class="name">{{ name }}</div>
					<div class="stat">
						<div class="header" [owTranslate]="'duels.hero-info.winrate-label'"></div>
						<div class="values">
							<div
								class="global-value"
								[helpTooltip]="'duels.hero-info.community-value-tooltip' | owTranslate"
							>
								{{ buildValue(globalWinrate, 1) }}%
							</div>
							<div class="my-value" [helpTooltip]="'duels.hero-info.your-value-tooltip' | owTranslate">
								({{ buildValue(playerWinrate, 1) }}%)
							</div>
						</div>
					</div>
					<div class="stat">
						<div class="header" [owTranslate]="'duels.hero-info.popularity-label'"></div>
						<div class="values">
							<div
								class="global-value"
								[helpTooltip]="'duels.hero-info.community-value-tooltip' | owTranslate"
							>
								{{ buildValue(globalPopularity, 1) }}%
							</div>
							<div class="my-value" [helpTooltip]="'duels.hero-info.your-value-tooltip' | owTranslate">
								({{ playerMatches }})
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="section-header" [owTranslate]="'duels.hero-info.win-distribution-header' | owTranslate"></div>
			<basic-bar-chart
				*ngIf="globalWinDistribution?.data?.length > 0"
				class="win-distribution"
				[data]="globalWinDistribution"
				[id]="'duels-hero-vignette-overlay' + name"
				[tooltipTitle]="'duels.hero-info.win-distribution-tooltip' | owTranslate"
			></basic-bar-chart>
			<div class="section-header" [owTranslate]="'duels.hero-info.top-decks-header' | owTranslate"></div>
			<div class="top-decks" *ngIf="decks?.length">
				<div class="top-deck" *ngFor="let deck of decks; trackBy: trackByDeck"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroInfoComponent {
	@Input() set heroInfo(value: DuelsHeroInfo) {
		console.debug('setting hero info', value);
		this.heroPortrait = this.i18n.getCardImage(value.cardId, { isHighRes: true, isHeroSkin: true });
		this.name = value.name;
		this.globalWinrate = value.globalWinrate;
		this.playerWinrate = value.playerWinrate;
		this.globalPopularity = value.globalPopularity;
		this.playerMatches = this.i18n.translateString('duels.hero-info.player-matches', {
			value: value.playerMatches,
		});
		this.globalWinDistribution = {
			data:
				value.globalWinDistribution?.map((input) => ({
					label: '' + input.winNumber,
					// To never show an empty bar
					value: Math.max(input.value, 0.5),
				})) ?? [],
		} as SimpleBarChartData;

		console.debug('hero portrait', this.heroPortrait);
	}

	heroPortrait: string;
	name: string;
	globalWinrate: number;
	playerWinrate: number;
	globalPopularity: number;
	playerMatches: string;
	globalWinDistribution: SimpleBarChartData;
	decks: readonly DuelsHeroInfoTopDeck[];

	constructor(private readonly i18n: LocalizationFacadeService) {}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return !value ? '-' : value.toFixed(decimals);
	}
}
