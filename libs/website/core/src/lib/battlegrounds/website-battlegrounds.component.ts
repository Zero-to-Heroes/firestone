import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	BgsMetaHeroStatsAccessService,
	BgsMetaHeroStatTierItem,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { from, Observable } from 'rxjs';

@Component({
	selector: 'website-battlegrounds',
	styleUrls: [`./website-battlegrounds.component.scss`],
	template: `
		<section class="section">
			(Work in progress) Time: last patch, Rank: all, Tribes: all
			<battlegrounds-meta-stats-heroes-view
				*ngIf="stats$ | async as stats"
				[stats]="stats"
				[heroSort]="'tier'"
			></battlegrounds-meta-stats-heroes-view>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: TranslateService,
		private readonly access: BgsMetaHeroStatsAccessService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.stats$ = from(this.access.loadMetaHeroStats('last-patch')).pipe(
			this.mapData((stats) => {
				console.debug('stats', stats, this.allCards, this);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					stats?.heroStats ?? [],
					100,
					[],
					true,
					this.allCards,
				);
				console.debug('[bgs] built global stats', result);
				return result;
			}),
		);
	}
}
