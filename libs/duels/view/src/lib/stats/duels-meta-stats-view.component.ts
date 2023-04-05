import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter, Observable, tap } from 'rxjs';
import { DuelsHeroSortFilterType, DuelsMetaStats, DuelsMetaStatsTier } from './duels-meta-stats-tier';
import { buildMonoTier, buildTiers } from './tier-utils';

@Component({
	selector: 'duels-meta-stats-view',
	styleUrls: [`./duels-meta-stats-view-columns.scss`, `./duels-meta-stats-view.component.scss`],
	template: `
		<section
			class="tiers-view"
			[attr.aria-label]="'Duels meta hero stats'"
			*ngIf="{ tiers: tiers$ | async } as value"
		>
			<div class="header">
				<div class="portrait"></div>
				<div class="details" [fsTranslate]="'app.duels.tier-list.header-hero-details'"></div>
				<div class="winrate" [fsTranslate]="'app.duels.tier-list.header-winrate'"></div>
				<div class="placement" [fsTranslate]="'app.duels.tier-list.header-placement-distribution'"></div>
			</div>
			<div class="stats-list" role="list" scrollable>
				<duels-meta-stats-tier
					*ngFor="let tier of value.tiers; trackBy: trackByFn"
					role="listitem"
					[tier]="tier"
				></duels-meta-stats-tier>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMetaStatsViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	// TODO: move this outside of the view?
	public static STATS_THRESHOLD = 40;

	tiers$: Observable<readonly DuelsMetaStatsTier[]>;

	// It's a "view" component, so we should pass data ready to be displayed
	// Preparing the data to be displayed according to all the filters / sorts
	// should be done in the business component, and extracted to helper methods
	// to avoid duplication
	@Input() set stats(value: readonly DuelsMetaStats[] | null) {
		this.stats$$.next(value ?? []);
	}
	@Input() set sort(value: DuelsHeroSortFilterType | null) {
		this.sort$$.next(value ?? 'global-winrate');
	}
	@Input() set hideLowData(value: boolean | null) {
		this.hideLowData$$.next(value ?? false);
	}
	@Input() set showPlayerGamesPlayed(value: boolean) {
		this.showPlayerGamesPlayed$$.next(value);
	}

	private stats$$ = new BehaviorSubject<readonly DuelsMetaStats[]>([]);
	private sort$$ = new BehaviorSubject<DuelsHeroSortFilterType>('global-winrate');
	private hideLowData$$ = new BehaviorSubject<boolean>(false);
	private showPlayerGamesPlayed$$ = new BehaviorSubject<boolean>(false);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([this.stats$$, this.sort$$, this.hideLowData$$]).pipe(
			tap((info) => console.debug('heroes info', info)),
			filter(([stats, heroSort]) => !!stats && !!heroSort),
			this.mapData(([stats, heroSort, hideLowData]) => {
				const filteredStats = stats.filter((stat) =>
					hideLowData ? stat.globalRunsPlayed >= DuelsMetaStatsViewComponent.STATS_THRESHOLD : true,
				);

				switch (heroSort) {
					case 'games-played':
						return buildMonoTier(
							[...filteredStats].sort(sortByProperties((s) => [-(s.playerRunsPlayed ?? 0)])),
						);
					case 'player-winrate':
						return buildMonoTier(
							[...filteredStats].sort(sortByProperties((s) => [-(s.playerWinrate ?? 0)])),
						);
					case 'global-winrate':
					default:
						return buildTiers(filteredStats, this.i18n);
				}
			}),
		);
	}

	trackByFn(index: number, stat: DuelsMetaStatsTier) {
		return stat.id;
	}
}
