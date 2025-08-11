/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsMetaCardStatTierItem, buildCardStats } from '@firestone/battlegrounds/data-access';
import { BattlegroundsCardsService } from '@firestone/battlegrounds/services';
import { BgsCardTierFilterType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter, shareReplay, switchMap, takeUntil } from 'rxjs';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-cards',
	styleUrls: [`./battlegrounds-meta-stats-cards.component.scss`],
	template: `
		<battlegrounds-meta-stats-cards-view
			[stats]="stats$ | async"
			[totalGames]="totalGames$ | async"
			[lastUpdate]="lastUpdate$ | async"
		></battlegrounds-meta-stats-cards-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaCardStatTierItem[]>;
	totalGames$: Observable<number>;
	lastUpdate$: Observable<Date | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly bgCards: BattlegroundsCardsService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.bgCards, this.prefs);

		const baseStats$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				timeFilter: prefs.bgsActiveTimeFilter,
				rankFilter: prefs.bgsActiveRankFilter,
			})),
			distinctUntilChanged((a, b) => a?.timeFilter === b?.timeFilter && a?.rankFilter === b?.rankFilter),
			switchMap(({ timeFilter, rankFilter }) => this.bgCards.loadCardStats(timeFilter, rankFilter)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.stats$ = combineLatest([
			baseStats$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTiers)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTurn)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTribesFilter)),
		]).pipe(
			this.mapData(([stats, cardTiers, turnNumber, tribesFilter]) => {
				const minTurn = buildMinTurn(cardTiers);
				return buildCardStats(stats?.cardStats ?? [], tribesFilter, minTurn, turnNumber, this.allCards);
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = baseStats$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => stats!.dataPoints),
		);
		this.lastUpdate$ = baseStats$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => (stats?.lastUpdateDate ? new Date(stats.lastUpdateDate) : null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

export const buildMinTurn = (cardTier: readonly BgsCardTierFilterType[] | undefined): number => {
	if (!cardTier?.length) {
		return 1;
	}
	const maxTier = Math.max(...cardTier);
	switch (maxTier) {
		case 1:
			return 1;
		case 2:
			return 2;
		case 3:
			return 4;
		case 4:
			return 6;
		case 5:
			return 8;
		case 6:
		case 7:
			return 10;
		default:
			return 1;
	}
};
