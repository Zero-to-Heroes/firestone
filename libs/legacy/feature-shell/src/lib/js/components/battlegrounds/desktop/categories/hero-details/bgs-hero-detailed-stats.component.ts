import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService, BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-hero-detailed-stats',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<with-loading [isLoading]="(bgHeroStats$ | async) == null">
			<div class="bgs-hero-detailed-stats">
				<div class="title" [owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.title'"></div>
				<div class="content" *ngIf="bgHeroStats$ | async as stats">
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.games-played'"
						></div>
						<div class="values">
							<div class="my-value">{{ stats.playerDataPoints }}</div>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.average-position'"
						></div>
						<div class="values">
							<div class="my-value">{{ buildValue(stats.playerAveragePosition) }}</div>
							<bgs-global-value [value]="buildValue(stats.averagePosition)"></bgs-global-value>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.top-1'"
						></div>
						<div class="values">
							<div class="my-value">{{ buildValue(stats.playerTop1, 1) }}%</div>
							<bgs-global-value [value]="buildValue(stats.top1, 1) + '%'"></bgs-global-value>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.top-4'"
						></div>
						<div class="values">
							<div class="my-value">{{ buildValue(stats.playerTop4, 1) }}%</div>
							<bgs-global-value [value]="buildValue(stats.top4, 1) + '%'"></bgs-global-value>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.net-mmr'"
							[helpTooltip]="
								'app.battlegrounds.personal-stats.hero-details.stats.net-mmr-tooltip' | owTranslate
							"
						></div>
						<div class="values">
							<div
								class="my-value"
								[ngClass]="{
									positive: stats.playerNetMmr > 0,
									negative: stats.playerNetMmr < 0
								}"
							>
								{{ buildValue(stats.playerNetMmr, 0) }}
							</div>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.avg-mmr-gain'"
							[helpTooltip]="
								'app.battlegrounds.personal-stats.hero-details.stats.avg-mmr-gain-tooltip' | owTranslate
							"
						></div>
						<div class="values">
							<div
								class="my-value"
								[ngClass]="{
									positive: stats.playerAverageMmrGain > 0,
									negative: stats.playerAverageMmrGain < 0
								}"
							>
								{{ buildValue(stats.playerAverageMmrGain, 0) }}
							</div>
						</div>
					</div>
					<div class="stat">
						<div
							class="header"
							[owTranslate]="'app.battlegrounds.personal-stats.hero-details.stats.avg-mmr-loss'"
							[helpTooltip]="
								'app.battlegrounds.personal-stats.hero-details.stats.avg-mmr-loss-tooltip' | owTranslate
							"
						></div>
						<div class="values">
							<div
								class="my-value "
								[ngClass]="{
									positive: stats.playerAverageMmrLoss > 0,
									negative: stats.playerAverageMmrLoss < 0
								}"
							>
								{{ buildValue(stats.playerAverageMmrLoss, 0) }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroDetailedStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	bgHeroStats$: Observable<BgsMetaHeroStatTierItem>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly heroStats: BgsPlayerHeroStatsService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.heroStats, this.nav);

		this.bgHeroStats$ = combineLatest([
			this.heroStats.tiersWithPlayerData$$,
			this.store.listen$(([main, nav]) => main.battlegrounds),
			this.nav.selectedCategoryId$$,
		]).pipe(
			map(([heroStats, [battlegrounds], selectedCategoryId]) => ({
				heroStats: heroStats,
				heroId: currentBgHeroId(battlegrounds, selectedCategoryId),
			})),
			filter((info) => !!info.heroId),
			this.mapData((info) => info.heroStats?.find((stat) => stat.id === info.heroId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
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
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<div
			class="global-value"
			[helpTooltip]="'app.battlegrounds.personal-stats.hero-details.stats.community-value-tooltip' | owTranslate"
		>
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
