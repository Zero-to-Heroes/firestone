import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaClassStat, WinsDistribution } from '@firestone-hs/arena-stats';
import {
	AbstractSubscriptionComponent,
	getStandardDeviation,
	sortByProperties,
} from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, shareReplay, startWith, tap } from 'rxjs';
import { ArenaClassStatsService } from '../../services/arena-class-stats.service';
import { ArenaClassInfo, ArenaClassTier } from './model';

@Component({
	selector: 'arena-class-tier-list',
	styleUrls: [`./arena-class-tier-list-columns.scss`, `./arena-class-tier-list.component.scss`],
	template: `
		<with-loading [isLoading]="loading$ | async">
			<section
				class="arena-class-tier-list"
				[attr.aria-label]="'Arena class tier list'"
				*ngIf="{ tiers: tiers$ | async } as value"
			>
				<div class="header">
					<div class="cell portrait"></div>
					<div class="cell class-details" [fsTranslate]="'app.arena.class-tier-list.header-hero-name'"></div>
					<div class="cell winrate" [fsTranslate]="'app.arena.class-tier-list.header-winrate'"></div>
					<div
						class="cell placement"
						[fsTranslate]="'app.arena.class-tier-list.header-placement-distribution'"
						[helpTooltip]="'app.arena.class-tier-list.header-placement-distribution-tooltip' | fsTranslate"
					></div>
				</div>
				<div class="heroes-list" role="list" scrollable>
					<arena-class-tier-list-tier
						*ngFor="let tier of value.tiers; trackBy: trackByFn"
						role="listitem"
						[tier]="tier"
					></arena-class-tier-list-tier>
				</div>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassTierListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	tiers$: Observable<readonly ArenaClassTier[] | null | undefined>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.arenaClassStats.isReady();

		console.debug('[arena-class-tier-list] after content init');
		this.tiers$ = this.arenaClassStats.classStats$$.pipe(
			tap((info) => console.debug('[arena-class-tier-list] received info', info)),
			this.mapData((stats) => {
				const averageWinsDistribution = this.buildAverageWinsDistribution(stats);
				console.debug(
					'averageWinsDistribution',
					averageWinsDistribution,
					averageWinsDistribution.map((d) => d.total).reduce((a, b) => a + b, 0),
				);
				return buildArenaClassInfoTiers(stats, averageWinsDistribution, this.i18n);
			}),
			shareReplay(1),
			tap((info) => console.debug('[arena-class-tier-list] received info 1', info)),
			this.mapData((tiers) => tiers),
		);
		this.loading$ = this.tiers$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-class-tier-list] received info 2', info)),
			this.mapData((tiers) => tiers === null),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: ArenaClassTier) {
		return item.label;
	}

	private buildAverageWinsDistribution(
		stats: readonly ArenaClassStat[] | null | undefined,
	): readonly WinsDistribution[] {
		if (!stats?.length) {
			return [];
		}

		const result: WinsDistribution[] = [];
		const totalGames = stats
			.flatMap((stat) => stat.winsDistribution)
			.map((d) => d.total)
			.reduce((a, b) => a + b, 0);
		for (let i = 0; i <= 12; i++) {
			const totalGamesForWin = stats
				.map((stat) => stat.winsDistribution.find((dist) => dist.wins === i)?.total ?? 0)
				.reduce((a, b) => a + b, 0);
			result.push({
				wins: i,
				total: totalGamesForWin / totalGames,
			});
		}
		return result;
	}
}

export const buildArenaClassInfoTiers = (
	stats: readonly ArenaClassStat[] | null | undefined,
	averageWinsDistribution: readonly WinsDistribution[] | null,
	i18n: ILocalizationService,
): readonly ArenaClassTier[] | null | undefined => {
	const classInfos = buildClassInfos(stats, averageWinsDistribution);
	return buildTiers(classInfos, i18n);
};

export const filterItems = (
	stats: readonly ArenaClassInfo[],
	threshold: number,
	upper: number,
): readonly ArenaClassInfo[] => {
	return stats.filter((stat) => stat.winrate).filter((stat) => stat.winrate >= threshold && stat.winrate < upper);
};

const buildClassInfos = (
	stats: readonly ArenaClassStat[] | null | undefined,
	averageWinsDistribution: readonly WinsDistribution[] | null,
): readonly ArenaClassInfo[] | null | undefined => {
	if (!stats?.length) {
		return stats === null ? null : undefined;
	}

	return stats.map((stat) => {
		const result: ArenaClassInfo = {
			playerClass: stat.playerClass,
			dataPoints: stat.totalGames,
			winrate: stat.totalsWins / stat.totalGames,
			placementDistribution: buildPlacementDistribution(stat.winsDistribution, averageWinsDistribution),
		};
		return result;
	});
};

const buildPlacementDistribution = (
	winsDistribution: readonly WinsDistribution[],
	averageWinsDistribution: readonly WinsDistribution[] | null,
): readonly WinsDistribution[] => {
	if (!averageWinsDistribution?.length) {
		return winsDistribution;
	}

	winsDistribution = [...winsDistribution].sort(sortByProperties((d: WinsDistribution) => [d.wins]));
	const totalGames = winsDistribution.map((dist) => dist.total).reduce((a, b) => a + b, 0);
	const winsDistributionInPercents = winsDistribution.map((d) => ({ wins: d.wins, total: d.total / totalGames }));
	// Build the placement distrubtion for wins ranging from 0 to 12
	const result: WinsDistribution[] = [];
	for (let i = 0; i <= 12; i++) {
		const distribution = winsDistributionInPercents.find((dist) => dist.wins === i);
		const averageForWins = averageWinsDistribution.find((dist) => dist.wins === i) as WinsDistribution;
		const delta = distribution ? distribution.total / averageForWins.total : 0;
		result.push({ wins: i, total: 100 * delta });
	}
	console.debug(
		'placementDistribution',
		result,
		winsDistributionInPercents,
		averageWinsDistribution,
		winsDistribution,
	);
	return result;
};

const buildTiers = (
	stats: readonly ArenaClassInfo[] | null | undefined,
	i18n: ILocalizationService,
): readonly ArenaClassTier[] | null | undefined => {
	console.debug('buildTiers', stats);
	if (stats == null) {
		return stats === null ? null : undefined;
	}

	const heroStats = [...stats].sort(sortByProperties((s) => [-s.winrate]));
	console.debug('heroStats', heroStats);
	const { mean, standardDeviation } = getStandardDeviation(heroStats.map((stat) => stat.winrate));

	return [
		{
			id: 'S',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'S' }),
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterItems(heroStats, mean + 3 * standardDeviation, 1),
		},
		{
			id: 'A',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'A' }),
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterItems(heroStats, mean + 1 * standardDeviation, mean + 3 * standardDeviation),
		},
		{
			id: 'B',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'B' }),
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterItems(heroStats, mean, mean + 1 * standardDeviation),
		},
		{
			id: 'C',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'C' }),
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterItems(heroStats, mean - standardDeviation, mean),
		},
		{
			id: 'D',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'D' }),
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterItems(heroStats, mean - 2 * standardDeviation, mean - standardDeviation),
		},
		{
			id: 'E',
			label: i18n.translateString('app.arena.class-tier-list.tier', { value: 'E' }),
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterItems(heroStats, 0, mean - 2 * standardDeviation),
		},
	].filter((tier) => tier.items?.length);
};
