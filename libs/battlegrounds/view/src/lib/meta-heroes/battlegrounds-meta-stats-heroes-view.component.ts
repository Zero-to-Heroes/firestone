/* eslint-disable @angular-eslint/template/eqeqeq */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { BgsMetaHeroStatTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, takeUntil } from 'rxjs';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-heroes-view',
	styleUrls: [
		`./battlegrounds-meta-stats-hero-columns.scss`,
		`./battlegrounds-meta-stats-heroes-view.component.scss`,
	],
	template: `
		<with-loading [isLoading]="(tiers$ | async) == null">
			<section
				class="battlegrounds-meta-stats-heroes"
				[attr.aria-label]="'Battlegrounds meta hero stats'"
				*ngIf="{ tiers: tiers$ | async } as value"
			>
				<div class="top">
					<div class="search">
						<battlegrounds-hero-search
							[searchString]="searchString$ | async"
							(searchStringChange)="searchStringChange.next($event)"
						></battlegrounds-hero-search>
					</div>
					<div class="data-info">
						<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
						<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
						<div class="separator">-</div>
						<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
						<div class="value">{{ totalGames$ | async }}</div>
					</div>
				</div>
				<div class="header">
					<div class="portrait"></div>
					<div class="hero-details" [fsTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>
					<div class="position" [fsTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>
					<div class="pickrate" [fsTranslate]="'app.battlegrounds.tier-list.header-pickrate'"></div>
					<div
						class="placement"
						[fsTranslate]="'app.battlegrounds.tier-list.header-placement-distribution'"
					></div>
					<div
						class="tribes"
						[fsTranslate]="'app.battlegrounds.tier-list.header-tribes'"
						[helpTooltip]="'app.battlegrounds.tier-list.header-tribes-tooltip' | fsTranslate"
					></div>
					<div
						class="net-mmr"
						[fsTranslate]="'app.battlegrounds.tier-list.header-net-mmr'"
						[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | fsTranslate"
					></div>
					<div
						class="player-games-played"
						[fsTranslate]="'app.battlegrounds.tier-list.header-games-played'"
						[helpTooltip]="'app.battlegrounds.tier-list.header-games-played-tooltip' | fsTranslate"
					></div>
					<!-- <div class="winrate" [owTranslate]="'app.battlegrounds.tier-list.header-combat-winrate'"></div> -->
				</div>
				<div class="heroes-list" role="list" scrollable>
					<battlegrounds-meta-stats-hero-tier
						*ngFor="let tier of value.tiers; trackBy: trackByFn"
						role="listitem"
						[tier]="tier"
						(heroStatClick)="onHeroStatsClick($event)"
					></battlegrounds-meta-stats-hero-tier>
					<a
						class="more-info"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Meta-Stats-for-Heroes"
						target="_blank"
						[fsTranslate]="'app.battlegrounds.tier-list.learn-more'"
					></a>
				</div>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaHeroStatTier[]>;
	lastUpdate$: Observable<string>;
	lastUpdateFull$: Observable<string>;
	totalGames$: Observable<string>;
	searchString$: Observable<string>;

	@Output() heroStatClick = new EventEmitter<string>();
	@Output() searchStringChange = new EventEmitter<string>();

	@Input() set stats(value: readonly BgsMetaHeroStatTierItem[]) {
		this.stats$$.next(value);
	}
	@Input() set heroSort(value: BgsHeroSortFilterType) {
		this.heroSort$$.next(value);
	}
	@Input() set searchString(value: string) {
		this.searchString$$.next(value);
	}
	@Input() set totalGames(value: number) {
		this.totalGames$$.next(value);
	}
	@Input() set lastUpdate(value: Date) {
		this.lastUpdate$$.next(value);
	}

	private stats$$ = new BehaviorSubject<readonly BgsMetaHeroStatTierItem[]>(null);
	private heroSort$$ = new BehaviorSubject<BgsHeroSortFilterType>('tier');
	private searchString$$ = new BehaviorSubject<string | null>(null);
	private totalGames$$ = new BehaviorSubject<number>(null);
	private lastUpdate$$ = new BehaviorSubject<Date>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		const tiers$ = combineLatest([this.stats$$, this.heroSort$$]).pipe(
			this.mapData(([stats, heroSort]) => {
				if (!stats) {
					return null;
				}

				switch (heroSort) {
					case 'average-position':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [s.playerAveragePosition ?? 9])),
						);
					case 'pick-rate':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier([...stats].sort(sortByProperties((s) => [-(s.pickrate ?? 0)])));
					case 'games-played':
						return this.buildMonoTier([...stats].sort(sortByProperties((s) => [-s.playerDataPoints])));
					case 'mmr':
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [-(s.playerNetMmr ?? -10000)])),
						);
					case 'last-played':
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [-s.playerLastPlayedTimestamp])),
						);
					case 'tier':
					default:
						return buildTiers(stats, this.i18n);
				}
			}),
		);
		this.tiers$ = combineLatest([tiers$, this.searchString$$]).pipe(
			this.mapData(([tiers, searchString]) => {
				return tiers
					?.map((tier) => {
						const result: BgsMetaHeroStatTier = {
							...tier,
							items: tier.items.filter((item) => {
								if (!searchString) {
									return true;
								}
								return item.name.toLowerCase().includes(searchString.toLowerCase());
							}),
						};
						return result;
					})
					.filter((t) => t.items.length > 0);
			}),
		);

		this.totalGames$ = this.totalGames$$.pipe(
			filter((totalGames) => totalGames != null),
			this.mapData((totalGames) => totalGames.toLocaleString(this.i18n.formatCurrentLocale())),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((date) => {
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
		);
		this.lastUpdateFull$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((date) => {
				return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
			}),
		);
	}

	trackByFn(index: number, stat: BgsMetaHeroStatTier) {
		return stat.label;
	}

	onHeroStatsClick(heroCardId: string) {
		if (this.heroStatClick) {
			this.heroStatClick.next(heroCardId);
		}
	}

	private buildMonoTier(items: BgsMetaHeroStatTierItem[]): readonly BgsMetaHeroStatTier[] {
		return [
			{
				id: null,
				label: null,
				tooltip: null,
				items: items,
			},
		];
	}
}
