import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaHeroStatTier, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { buildTiers } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { sortByProperties } from '@legacy-import/src/lib/js/services/utils';
import { combineLatest, Observable, tap } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-meta-stats-heroes',
	// FIXME: columns declarations should move to the "view" component
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-hero-columns.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-meta-stats-heroes"
			[attr.aria-label]="'Battlegrounds meta hero stats'"
			*ngIf="{ tiers: tiers$ | async } as value"
		>
			<div class="header">
				<div class="portrait"></div>
				<div class="hero-details" [owTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>
				<div class="position" [owTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>
				<div
					class="placement"
					[owTranslate]="'app.battlegrounds.tier-list.header-placement-distribution'"
				></div>
				<div
					class="net-mmr"
					[owTranslate]="'app.battlegrounds.tier-list.header-net-mmr'"
					[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | owTranslate"
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
					[owTranslate]="'app.battlegrounds.tier-list.learn-more'"
				></a>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaHeroStatTier[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([
			this.store.bgsMetaStatsHero$(),
			this.store.listenPrefs$((prefs) => prefs.bgsActiveHeroSortFilter),
		]).pipe(
			tap((info) => console.debug('heroes info', info)),
			this.mapData(([stats, [heroSort]]) => {
				switch (heroSort) {
					case 'tier':
						return buildTiers(stats, this.i18n);
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
				}
			}),
		);
	}

	trackByFn(index: number, stat: BgsMetaHeroStatTier) {
		return stat.label;
	}

	onHeroStatsClick(heroCardId: string) {
		this.store.send(new BgsPersonalStatsSelectHeroDetailsEvent(heroCardId));
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
