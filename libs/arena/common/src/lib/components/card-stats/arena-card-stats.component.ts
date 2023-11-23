import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaCardStat } from '@firestone-hs/arena-stats';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, shareReplay, startWith, tap } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaCardStatInfo } from './model';

@Component({
	selector: 'arena-card-stats',
	styleUrls: [`./arena-card-stats-columns.scss`, `./arena-card-stats.component.scss`],
	template: `
		<with-loading [isLoading]="loading$ | async">
			<section
				class="arena-card-stats"
				[attr.aria-label]="'Arena card stats'"
				*ngIf="{ cards: cards$ | async } as value"
			>
				<div class="header">
					<div class="cell card-details" [fsTranslate]="'app.arena.card-stats.header-card-name'"></div>
					<div class="cell drawn-total" [fsTranslate]="'app.arena.card-stats.header-drawn-total'"></div>
					<div class="cell drawn-winrate" [fsTranslate]="'app.arena.card-stats.header-drawn-winrate'"></div>
				</div>
				<virtual-scroller
					#scroll
					[items]="value.cards!"
					[bufferAmount]="25"
					role="list"
					class="cards-list"
					scrollable
				>
					<arena-card-stat-item
						*ngFor="let card of scroll.viewPortItems; trackBy: trackByFn"
						class="card-info"
						role="listitem"
						[card]="card"
					></arena-card-stat-item>
				</virtual-scroller>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	cards$: Observable<ArenaCardStatInfo[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.arenaCardStats.isReady();

		console.debug('[arena-card-stats] after content init');
		this.cards$ = this.arenaCardStats.cardStats$$.pipe(
			tap((info) => console.debug('[arena-card-stats] received info', info)),
			this.mapData((stats) => this.buildCardStats(stats)),
			shareReplay(1),
			this.mapData((tiers) => tiers),
		);
		this.loading$ = this.cards$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-card-stats]] received info 2', info)),
			this.mapData((tiers) => tiers === null),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: ArenaCardStatInfo) {
		return item.cardId;
	}

	private buildCardStats(stats: readonly ArenaCardStat[] | null | undefined): ArenaCardStatInfo[] {
		return (
			stats
				?.filter((stat) => stat.stats?.drawn > 100)
				?.map((stat) => this.buildCardStat(stat))
				.sort(sortByProperties((a: ArenaCardStatInfo) => [-(a.drawWinrate ?? 0)])) ?? []
		);
	}

	private buildCardStat(stat: ArenaCardStat): ArenaCardStatInfo {
		return {
			cardId: stat.cardId,
			drawnTotal: stat.stats.drawn,
			drawWinrate: stat.stats.drawn > 0 ? stat.stats.drawnThenWin / stat.stats.drawn : null,
		};
	}
}
