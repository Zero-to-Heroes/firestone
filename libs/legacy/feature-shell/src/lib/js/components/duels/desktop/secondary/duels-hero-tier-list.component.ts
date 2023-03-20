import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { CardIds } from '@firestone-hs/reference-data';
import { DuelsMetaStatsViewComponent } from '@firestone/duels/view';
import { getStandardDeviation } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsHeroPlayerStat } from '../../../../models/duels/duels-player-stats';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { buildDuelsHeroPlayerStats, filterDuelsHeroStats } from '../../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-hero-tier-list',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-hero-tier-list.component.scss`],
	template: `
		<div class="duels-hero-tier-list" *ngIf="tiers$ | async as tiers" scrollable>
			<div
				class="title"
				[owTranslate]="'app.duels.stats.tier-list-title'"
				[helpTooltip]="'app.duels.stats.tier-list-title-tooltip' | owTranslate"
			></div>
			<duels-tier class="duels-tier" *ngFor="let tier of tiers" [tier]="tier"></duels-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroTierListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	tiers$: Observable<readonly DuelsTier[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = this.store
			.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
				([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsHideStatsBelowThreshold,
			)
			.pipe(
				filter(
					([
						duelsStats,
						statType,
						gameMode,
						timeFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						mmrFilter,
						hideThreshold,
					]) => !!duelsStats?.length,
				),
				map(
					([
						duelStats,
						statType,
						gameMode,
						timeFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						mmrFilter,
						hideThreshold,
					]) =>
						[
							filterDuelsHeroStats(
								duelStats,
								classFilter,
								heroPowerFilter,
								sigTreasureFilter,
								statType,
								this.allCards,
								null,
							),
							statType,
							hideThreshold,
						] as [readonly DuelsHeroStat[], DuelsStatTypeFilterType, boolean],
				),
				// distinctUntilChanged((a, b) => this.areEqual(a, b)),
				this.mapData(([duelsStats, statType, hideThreshold]) => {
					const stats = buildDuelsHeroPlayerStats(duelsStats, statType)
						.sort((a, b) => b.globalWinrate - a.globalWinrate)
						.filter((stat) =>
							hideThreshold
								? stat.globalTotalMatches >= DuelsMetaStatsViewComponent.STATS_THRESHOLD
								: true,
						);

					const { mean, standardDeviation } = getStandardDeviation(stats.map((stat) => stat.globalWinrate));
					return [
						{
							label: 'S',
							tooltip: this.i18n.translateString('app.duels.stats.tier-s-tooltip'),
							items: this.filterItems(stats, mean + 2 * standardDeviation, 101),
						},
						{
							label: 'A',
							tooltip: this.i18n.translateString('app.duels.stats.tier-a-tooltip'),
							items: this.filterItems(stats, mean + standardDeviation, mean + 2 * standardDeviation),
						},
						{
							label: 'B',
							tooltip: this.i18n.translateString('app.duels.stats.tier-b-tooltip'),
							items: this.filterItems(stats, mean, mean + standardDeviation),
						},
						{
							label: 'C',
							tooltip: this.i18n.translateString('app.duels.stats.tier-c-tooltip'),
							items: this.filterItems(stats, mean - standardDeviation, mean),
						},
						{
							label: 'D',
							tooltip: this.i18n.translateString('app.duels.stats.tier-d-tooltip'),
							items: this.filterItems(stats, mean - 2 * standardDeviation, mean - standardDeviation),
						},
						{
							label: 'E',
							tooltip: this.i18n.translateString('app.duels.stats.tier-e-tooltip'),
							items: this.filterItems(stats, 0, mean - 2 * standardDeviation),
						},
					].filter((tier) => tier.items?.length);
				}),
			);
	}

	private filterItems(
		stats: readonly DuelsHeroPlayerStat[],
		threshold: number,
		upper: number,
	): readonly DuelsTierItem[] {
		return stats
			.filter((stat) => stat.globalWinrate)
			.filter((stat) => stat.globalWinrate >= threshold && stat.globalWinrate < upper)
			.map((stat) => {
				const isNeutralHero =
					stat.cardId.startsWith(CardIds.VanndarStormpikeTavernBrawl) ||
					stat.cardId.startsWith(CardIds.DrektharTavernBrawl);
				const card = stat.cardId ? this.allCards.getCard(stat.cardId) : null;
				return {
					cardId: stat.cardId,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${stat.cardId}.jpg`,
					secondaryClassIcon: isNeutralHero
						? `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${card?.playerClass?.toLowerCase()}.png`
						: null,
				};
			});
	}
}
