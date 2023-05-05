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
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';

@Component({
	selector: 'battlegrounds-meta-stats-heroes-view',
	styleUrls: [
		`./battlegrounds-meta-stats-hero-columns.scss`,
		`./battlegrounds-meta-stats-heroes-view.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-meta-stats-heroes"
			[attr.aria-label]="'Battlegrounds meta hero stats'"
			*ngIf="{ tiers: tiers$ | async } as value"
		>
			<div class="header">
				<div class="portrait"></div>
				<div class="hero-details" [fsTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>
				<div class="position" [fsTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>
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
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaHeroStatTier[]>;

	@Output() heroStatClick = new EventEmitter<string>();

	@Input() set stats(value: readonly BgsMetaHeroStatTierItem[]) {
		this.stats$$.next(value);
	}
	@Input() set heroSort(value: BgsHeroSortFilterType) {
		this.heroSort$$.next(value);
	}

	private stats$$ = new BehaviorSubject<readonly BgsMetaHeroStatTierItem[]>(null);
	private heroSort$$ = new BehaviorSubject<BgsHeroSortFilterType>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([this.stats$$, this.heroSort$$]).pipe(
			filter(([stats, heroSort]) => !!stats && !!heroSort),
			this.mapData(([stats, heroSort]) => {
				switch (heroSort) {
					case 'average-position':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier(
							[...stats].sort(sortByProperties((s) => [s.playerAveragePosition ?? 9])),
						);
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
