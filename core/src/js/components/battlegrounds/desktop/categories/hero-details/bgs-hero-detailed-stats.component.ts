import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsHeroStat } from '../../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../../../../models/battlegrounds/stats/bgs-stats';
import { AppUiStoreService, cdLog, currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'bgs-hero-detailed-stats',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<div class="bgs-hero-detailed-stats">
			<div class="title">General stats</div>
			<div class="content" *ngIf="bgHeroStats$ | async as stats">
				<div class="stat">
					<div class="header">Games played</div>
					<div class="values">
						<div class="my-value">{{ stats.playerGamesPlayed }}</div>
					</div>
				</div>
				<div class="stat">
					<div class="header">Avg. position</div>
					<div class="values">
						<div class="my-value">{{ buildValue(stats.playerAveragePosition) }}</div>
						<bgs-global-value [value]="buildValue(stats.averagePosition)"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 1</div>
					<div class="values">
						<div class="my-value">{{ buildValue(stats.playerTop1, 1) }}%</div>
						<bgs-global-value [value]="buildValue(stats.top1, 1) + '%'"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 4</div>
					<div class="values">
						<div class="my-value">{{ buildValue(stats.playerTop4, 1) }}</div>
						<bgs-global-value [value]="buildValue(stats.top4, 1) + '%'"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR gain/loss per match">Avg. net MMR</div>
					<div class="values">
						<div
							class="my-value"
							[ngClass]="{
								'positive': stats.playerAverageMmr > 0,
								'negative': stats.playerAverageMmr < 0
							}"
						>
							{{ buildValue(stats.playerAverageMmr, 0) }}
						</div>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR gain per match">Avg. MMR gain</div>
					<div class="values">
						<div
							class="my-value"
							[ngClass]="{
								'positive': stats.playerAverageMmrGain > 0,
								'negative': stats.playerAverageMmrGain < 0
							}"
						>
							{{ buildValue(stats.playerAverageMmrGain, 0) }}
						</div>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR loss per match">Avg. MMR loss</div>
					<div class="values">
						<div
							class="my-value "
							[ngClass]="{
								'positive': stats.playerAverageMmrLoss > 0,
								'negative': stats.playerAverageMmrLoss < 0
							}"
						>
							{{ buildValue(stats.playerAverageMmrLoss, 0) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroDetailedStatsComponent {
	bgHeroStats$: Observable<BgsHeroStat>;

	constructor(private readonly store: AppUiStoreService) {
		this.bgHeroStats$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => main.battlegrounds.stats,
			)
			.pipe(
				map(
					([battlegrounds, selectedCategoryId, bgsStats]) =>
						[currentBgHeroId(battlegrounds, selectedCategoryId), bgsStats] as [string, BgsStats],
				),
				filter(([heroId, bgsStats]) => !!heroId && !!bgsStats),
				map(([heroId, bgsStats]) => bgsStats.heroStats?.find((stat) => stat.id === heroId)),
				distinctUntilChanged(),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
			);
	}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return !value ? '-' : value.toFixed(decimals);
	}
}

@Component({
	selector: 'bgs-global-value',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<div class="global-value" helpTooltip="Average value for the community">
			<div class="global-icon">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#global" />
				</svg>
			</div>
			<span class="value">{{ value }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsGlobalValueComponent {
	@Input() value: string;
}
